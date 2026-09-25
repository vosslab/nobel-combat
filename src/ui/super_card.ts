import type { SpecialDef } from "../roster/fighter_def";

const DISPLAY_SECONDS = 1;

type SuperCardElements = Readonly<{
  root: HTMLElement;
  fighterName: HTMLElement;
  specialName: HTMLElement;
  caption: HTMLElement;
  announcement: HTMLElement;
}>;

/** A render-time-only presentation of a tier-three special release. */
export class SuperCard {
  private remaining = 0;

  constructor(private readonly elements: SuperCardElements) {}

  present(fighterName: string, special: SpecialDef): void {
    const { root, fighterName: fighter, specialName, caption, announcement } = this.elements;
    fighter.textContent = fighterName;
    specialName.textContent = special.name;
    caption.textContent = special.caption;
    // Replacing the text node creates a new live-region mutation even when a
    // fighter repeats the same super. Assigning identical text is ignored by
    // many accessibility trees, so that later release would otherwise be silent.
    announcement.replaceChildren(special.name);
    this.remaining = DISPLAY_SECONDS;
    root.hidden = false;
  }

  update(frameSeconds: number): void {
    this.remaining = Math.max(0, this.remaining - frameSeconds);
    this.elements.root.hidden = this.remaining <= Number.EPSILON;
  }

  dismiss(): void {
    this.remaining = 0;
    this.elements.root.hidden = true;
  }
}
