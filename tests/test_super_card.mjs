import assert from "node:assert/strict";
import { test } from "node:test";
import { SuperCard } from "../src/ui/super_card.ts";

function element() {
  const mutations = [];
  return {
    hidden: true,
    textContent: "",
    mutations,
    replaceChildren(value) {
      this.textContent = String(value);
      mutations.push(this.textContent);
    },
  };
}

test("super card renders supplied content and repeats same-name live-region mutations", () => {
  const root = element();
  const fighterName = element();
  const specialName = element();
  const caption = element();
  const announcement = element();
  const card = new SuperCard({ root, fighterName, specialName, caption, announcement });
  const fighter = "Test Fighter";
  const special = {
    name: "Test Special",
    caption: "Test caption.",
    pose: "heavy",
    ticks: 32,
    blocks: [],
  };

  card.present(fighter, special);
  assert.equal(root.hidden, false);
  assert.equal(fighterName.textContent, fighter);
  assert.equal(specialName.textContent, special.name);
  assert.equal(caption.textContent, special.caption);
  assert.equal(announcement.textContent, special.name, "the polite announcement is name-only");

  card.present(fighter, special);
  assert.deepEqual(
    announcement.mutations,
    [special.name, special.name],
    "repeating the same super creates a second live-region mutation",
  );
});
