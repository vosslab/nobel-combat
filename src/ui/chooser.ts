import { ROSTER, fighterById } from "../roster/roster";
import type { FighterId } from "../roster/roster";
import type { FighterCategory, NobelPrize, UnlockRule } from "../roster/fighter_def";
import type { SelectionInput } from "../input";
export type { SelectionInput } from "../input";

type FighterChooserOptions = Readonly<{
  dialog: HTMLDialogElement;
  choices: HTMLFieldSetElement;
  detail: HTMLElement;
  help: HTMLElement;
  start: HTMLButtonElement;
  change: HTMLButtonElement;
  initiallyConfirmed: boolean;
  availableIds: () => readonly FighterId[];
  currentInput: () => SelectionInput;
  canReopen: () => boolean;
  onOpen: () => void;
  onConfirm: (id: FighterId) => void;
}>;

const CATEGORY_NAMES: Readonly<Record<FighterCategory, string>> = {
  originals: "Originals",
  structural_biology_biochemistry: "Structural biology and biochemistry",
  genetics_molecular_biology: "Genetics and molecular biology",
  cell_biology_neuroscience: "Cell biology and neuroscience",
  chemical_biology: "Chemical biology",
  fluorescence_imaging: "Fluorescence and imaging",
  physics_energy: "Physics and energy",
};

/** Keep this separate from the progress interpreter: it only describes a rule to a player. */
export function unlockHint(rule: UnlockRule): string {
  if (rule.kind === "starter") return "Available now";
  if (rule.kind === "wins") return `Win ${rule.count} ${rule.count === 1 ? "match" : "matches"}`;
  const names = rule.fighterIds.map((id) =>
    id in ROSTER ? fighterById(id as FighterId).name : formatIdentifier(id),
  );
  return `Win as ${formatNames(names)}`;
}

export class FighterChooser {
  private readonly options: FighterChooserOptions;
  private selectedId: FighterId = "warburg";
  private confirmed: boolean;
  private waitingForRelease = false;
  private profileFocused = false;
  private selectionHeld: SelectionInput = {
    previous: false,
    next: false,
    up: false,
    down: false,
    profile: false,
    confirm: false,
  };
  private renderedSignature = "";

  constructor(options: FighterChooserOptions) {
    this.options = options;
    this.confirmed = options.initiallyConfirmed;
    this.refresh();
    options.dialog.addEventListener("cancel", this.preventCancel);
    options.dialog.addEventListener("keydown", this.trapTab);
    options.choices.addEventListener("change", this.onChoiceChange);
    options.start.addEventListener("click", this.confirmSelection);
    options.change.addEventListener("click", this.reopenSelection);
  }

  get selection(): FighterId {
    return this.selectedId;
  }

  get isConfirmed(): boolean {
    return this.confirmed;
  }

  focusSelected(): void {
    this.profileFocused = false;
    this.choice(this.selectedId)?.focus();
  }

  refresh(): void {
    const availableIds = this.options.availableIds();
    if (!availableIds.length)
      throw new Error("The fighter chooser needs at least one available fighter.");
    if (!availableIds.includes(this.selectedId)) this.selectedId = availableIds[0]!;
    const signature = availableIds.join(",");
    if (signature !== this.renderedSignature) this.renderChoices(availableIds, signature);
    for (const id of availableIds) {
      const choice = this.choice(id);
      if (choice) choice.checked = id === this.selectedId;
    }
    this.renderDetail(this.selectedId);
    this.options.help.textContent = `Select ${formatNames(availableIds.map((id) => fighterById(id).name))}. The other fighter is controlled by the AI.`;
  }

  update(input: SelectionInput): void {
    if (this.confirmed) return;
    const previous = input.previous && !input.next && !this.selectionHeld.previous;
    const next = input.next && !input.previous && !this.selectionHeld.next;
    const up = input.up && !input.down && !this.selectionHeld.up;
    const down = input.down && !input.up && !this.selectionHeld.down;
    const profile = input.profile && !this.selectionHeld.profile;
    const confirm = input.confirm && !this.selectionHeld.confirm;
    this.selectionHeld = input;
    if (profile && this.focusProfile()) return;
    if (document.activeElement === this.profileLink() && !this.profileFocused) {
      if (previous || next || up || down) this.focusSelected();
      return;
    }
    if (this.profileFocused) {
      if (confirm) this.profileLink()?.click();
      else if (previous || next || up || down) this.focusSelected();
      return;
    }
    if (previous || next) this.selectLinear(next ? 1 : -1);
    if (up || down) this.selectVertical(down ? 1 : -1);
    if (confirm) this.confirmSelection();
  }

  blockActionsUntilRelease(input: SelectionInput): boolean {
    if (!this.waitingForRelease) return false;
    if (input.previous || input.next || input.up || input.down || input.profile || input.confirm)
      return true;
    this.waitingForRelease = false;
    return false;
  }

  private readonly preventCancel = (event: Event): void => event.preventDefault();

  private readonly trapTab = (event: KeyboardEvent): void => {
    if (event.code !== "Tab") return;
    const active = document.activeElement;
    const onRadio = active instanceof HTMLInputElement && active.name === "fighter";
    const profile = this.profileLink();
    if (!event.shiftKey && active === this.options.start) {
      event.preventDefault();
      this.focusSelected();
    } else if (event.shiftKey && onRadio) {
      event.preventDefault();
      this.options.start.focus();
    } else if (!profile && !event.shiftKey && onRadio) {
      event.preventDefault();
      this.options.start.focus();
    } else if (!profile && event.shiftKey && active === this.options.start) {
      event.preventDefault();
      this.focusSelected();
    }
  };

  private readonly onChoiceChange = (event: Event): void => {
    const choice = event.target;
    if (!(choice instanceof HTMLInputElement) || choice.name !== "fighter") return;
    const id = this.options.availableIds().find((availableId) => availableId === choice.value);
    if (id) this.select(id);
  };

  private readonly confirmSelection = (): void => {
    if (this.confirmed) return;
    this.confirmed = true;
    this.waitingForRelease = true;
    this.options.dialog.close();
    this.options.onConfirm(this.selectedId);
  };

  private readonly reopenSelection = (): void => {
    if (!this.options.canReopen()) return;
    this.refresh();
    this.confirmed = false;
    this.profileFocused = false;
    this.selectionHeld = this.options.currentInput();
    this.waitingForRelease = false;
    this.options.onOpen();
    this.options.dialog.hidden = false;
    this.options.dialog.showModal();
    requestAnimationFrame(() => this.focusSelected());
  };

  private selectLinear(direction: 1 | -1): void {
    const ids = this.options.availableIds();
    const selectedIndex = ids.indexOf(this.selectedId);
    const index = selectedIndex < 0 ? 0 : selectedIndex;
    this.select(ids[(index + direction + ids.length) % ids.length]!, true);
  }

  private selectVertical(direction: 1 | -1): void {
    const current = this.choice(this.selectedId);
    if (!current) return;
    const source = current.getBoundingClientRect();
    const candidates = this.options
      .availableIds()
      .filter((id) => id !== this.selectedId)
      .map((id) => ({ id, box: this.choice(id)?.getBoundingClientRect() }))
      .filter(
        (candidate): candidate is { id: FighterId; box: DOMRect } => candidate.box !== undefined,
      );
    const vertical = candidates.filter((candidate) =>
      direction > 0 ? candidate.box.top > source.top + 1 : candidate.box.top < source.top - 1,
    );
    if (!vertical.length) return;
    vertical.sort((left, right) => {
      const leftDistance = Math.abs(left.box.top - source.top);
      const rightDistance = Math.abs(right.box.top - source.top);
      if (leftDistance !== rightDistance) return leftDistance - rightDistance;
      return Math.abs(left.box.left - source.left) - Math.abs(right.box.left - source.left);
    });
    this.select(vertical[0]!.id, true);
  }

  private select(id: FighterId, focus = false): void {
    if (!this.options.availableIds().includes(id)) return;
    this.selectedId = id;
    this.profileFocused = false;
    this.refresh();
    if (focus) this.focusSelected();
  }

  private choice(id: FighterId): HTMLInputElement | null {
    return this.options.choices.querySelector(`input[name="fighter"][value="${id}"]`);
  }

  private profileLink(): HTMLAnchorElement | null {
    return this.options.detail.querySelector("a");
  }

  private focusProfile(): boolean {
    const link = this.profileLink();
    if (!link) return false;
    this.profileFocused = !this.profileFocused;
    if (this.profileFocused) link.focus();
    else this.focusSelected();
    return true;
  }

  private renderChoices(availableIds: readonly FighterId[], signature: string): void {
    const legend = this.options.choices.querySelector("legend");
    if (!legend) throw new Error("The fighter chooser is missing its legend.");
    const focusedId =
      document.activeElement instanceof HTMLInputElement &&
      document.activeElement.name === "fighter"
        ? document.activeElement.value
        : null;
    const available = new Set(availableIds);
    const groups = new Map<FighterCategory, FighterId[]>();
    for (const id of Object.keys(ROSTER) as FighterId[]) {
      if (id === "franklin" && !available.has(id)) continue;
      const category = fighterById(id).category;
      const ids = groups.get(category) ?? [];
      ids.push(id);
      groups.set(category, ids);
    }
    this.options.choices.replaceChildren(
      legend,
      ...[...groups].map(([category, ids]) => this.createCategory(category, ids, available)),
    );
    this.renderedSignature = signature;
    if (focusedId && available.has(focusedId as FighterId)) {
      requestAnimationFrame(() => this.choice(focusedId as FighterId)?.focus());
    }
  }

  private createCategory(
    category: FighterCategory,
    ids: readonly FighterId[],
    available: ReadonlySet<FighterId>,
  ): HTMLElement {
    const section = document.createElement("section");
    section.className = "fighter-category";
    const heading = document.createElement("h2");
    heading.textContent = CATEGORY_NAMES[category];
    const grid = document.createElement("div");
    grid.className = "fighter-card-grid";
    for (const id of ids) grid.append(this.createChoice(id, available.has(id)));
    section.append(heading, grid);
    return section;
  }

  private createChoice(id: FighterId, unlocked: boolean): HTMLElement {
    const fighter = fighterById(id);
    if (!unlocked) {
      const card = document.createElement("article");
      card.className = "fighter-choice fighter-choice-locked";
      card.setAttribute("aria-label", `Locked fighter: ${unlockHint(fighter.unlock)}`);
      const silhouette = document.createElement("span");
      silhouette.className = "fighter-silhouette";
      silhouette.setAttribute("aria-hidden", "true");
      const hint = document.createElement("small");
      hint.textContent = unlockHint(fighter.unlock);
      card.append(silhouette, hint);
      return card;
    }
    const label = document.createElement("label");
    label.className = "fighter-choice";
    label.htmlFor = `select-${id}`;
    const input = document.createElement("input");
    input.id = `select-${id}`;
    input.name = "fighter";
    input.type = "radio";
    input.value = id;
    const description = document.createElement("span");
    const name = document.createElement("strong");
    name.textContent = fighter.name;
    const detail = document.createElement("small");
    detail.textContent = capitalize(fighter.verb);
    description.append(name, detail);
    label.append(input, description);
    return label;
  }

  private renderDetail(id: FighterId): void {
    const fighter = fighterById(id);
    const heading = document.createElement("h2");
    heading.textContent = fighter.name;
    const prize = document.createElement("p");
    prize.className = "fighter-prize";
    prize.textContent = fighter.prize
      ? `Nobel Prize in ${formatPrizeCategory(fighter.prize.category)} ${fighter.prize.year}: ${fighter.prize.citation}.`
      : "Scientific work recognized in this game.";
    const verb = document.createElement("p");
    verb.className = "fighter-verb";
    verb.textContent = `Combat verb: ${capitalize(fighter.verb)}.`;
    const specials = document.createElement("ul");
    specials.className = "fighter-specials";
    for (const special of fighter.specials) {
      const item = document.createElement("li");
      const name = document.createElement("strong");
      name.textContent = special.name;
      item.append(name, document.createTextNode(` \u2014 ${special.caption}`));
      specials.append(item);
    }
    const contents: Node[] = [heading, prize, verb, specials];
    if (fighter.prize) {
      const link = document.createElement("a");
      link.href = fighter.prize.url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = `Read about ${fighter.name}`;
      contents.push(link);
    }
    this.options.detail.replaceChildren(...contents);
  }
}

function formatNames(names: readonly string[]): string {
  if (names.length < 2) return names[0] ?? "a fighter";
  if (names.length === 2) return `${names[0]} or ${names[1]}`;
  return `${names.slice(0, -1).join(", ")}, or ${names[names.length - 1]}`;
}

function formatPrizeCategory(category: NobelPrize["category"]): string {
  return category === "physiology_medicine" ? "Physiology or Medicine" : capitalize(category);
}

function formatIdentifier(value: string): string {
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter: string) => letter.toUpperCase());
}

function capitalize(value: string): string {
  return value.length ? `${value[0]!.toUpperCase()}${value.slice(1)}` : value;
}
