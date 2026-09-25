# Special schema proof

The draft covers 25 game fighters and 75 specials in
[`src/roster/special_drafts.ts`](../../../src/roster/special_drafts.ts). Its exact-key record
requires every draft id, and each `FighterDraft` requires three specials. Captions were working joke
lines in this M2 draft; the completed M4 dossiers record the scientific references, and WP-CAPTIONS
transferred the reviewed captions into the fighter drafts.

## Encoded specials

| Fighter | Tier 1 | Tier 2 | Tier 3 |
| --- | --- | --- | --- |
| Warburg | Lactate Drive: reposition + strike | Aerobic Glycolysis: self modifier | Oxygen Transfer Surge: strike + zone |
| Curie | Separation Step: strike | Radium Glow: zone + slow | Polonium Burst: ring projectiles |
| Franklin | Photo 51: cross projectiles | Crystal Fiber: stun | Double Helix: zone + strike |
| David Baker | Rosetta Fold: strike | De Novo Design: spiral projectile + strike | Top7: stun + delayed zone |
| Thomas Steitz | 50S Slam: zone + strike | Peptidyl Transferase: repeated strike | Translation Termination: stun + strike |
| Joachim Frank | Vitrification: stun | Particle Average: self modifier + shield | 3D Reconstruction: zone + strike |
| Dorothy Crowfoot Hodgkin | X-Ray Diffraction: cross projectiles | Electron Density: zone + slow | Vitamin B12: delayed zone |
| Christian Anfinsen | Denaturation: opponent modifiers | Sequence Determines Structure: spiral projectile + strike | Anfinsen's Dogma: reposition + strike |
| Jennifer Doudna | Guide RNA: homing projectile + stun | Cas9 Cleavage: homing projectile + strike | CRISPR Rewrite: zone + damage reduction |
| Barbara McClintock | Ac/Ds: paired homing projectiles + slow | Maize Chromosome: zone + strike | TRANSPOSON: reposition + strike |
| Elizabeth Blackburn | Telomere Cap: shield | Telomerase: heal | Replicative Senescence: repeated zone + slow + damage reduction |
| Katalin Kariko | Modified Nucleoside: block-piercing projectile | Lipid Nanoparticle: repeated ring projectiles | mRNA Translation: homing projectile + damage reduction |
| Sidney Altman | RNase P: shield + counterstrike | RNA Catalyst: repeated zone + strike | RNA Is the Enzyme: block-piercing strike |
| Thomas Cech | Group I Intron: stun + slow | Self-Splice: reposition + strike | Ribozyme: block-piercing spiral projectile |
| David Baltimore | Reverse Transcriptase: returning homing projectile | Proviral Integration: delayed projectile + zone | Central Dogma Reversed: slow + delayed projectile |
| Rita Levi-Montalcini | NGF: repeated homing projectiles | Axon Guidance: long-range homing projectile | Growth Factor: repeated zone + stun |
| Linda Buck | Odorant Receptor: block-piercing homing projectile | Combinatorial Code: repeated fan projectiles | OLFACTORY OVERLOAD: large damaging stun zone |
| Carolyn Bertozzi | Bioorthogonal Reaction: block-piercing homing projectile | Click: paired projectile + strike | Glycocalyx: zone + slow |
| K. Barry Sharpless | Sharpless Epoxidation: strike + zone | Click: paired projectile + strike | Second Nobel: strike + delayed projectile + meter refund |
| Roger Tsien | GFP: zone + defense reduction | Calcium Indicator: homing projectile + slow | Fluorescent Palette: alternating projectiles + zone |
| Dennis Gabor | Interference Pattern: cross projectiles | Holographic Double: shield + reposition | Wavefront Reconstruction: repeated zone + strike |
| John B. Goodenough | Lithium Ion: shield + self damage modifier | Cobalt Oxide Cathode: shield | FULLY CHARGED: damage-scaled strike |
| Donna Strickland | Chirp: slow, wide projectile | Amplify: self damage modifier | Pulse Compression: delayed fast projectile |
| John Bardeen | Transistor: small strike + amplified strike | Cooper Pair: paired projectiles | BCS Superconductivity: repeated zone + shield |
| Gerhard Herzberg | Absorption Spectrum: shield + counterprojectile | Free Radical: repeated homing projectiles | Molecular Spectrum: repeated fan projectiles + stun |

## Schema findings

- `ProjectileBlock.pattern` is generic presentation geometry: `single`, `paired`, `fan`, `cross`,
  `ring`, `spiral`, `returning`, or `alternating`. It supports Photo 51's X pattern,
  Sharpless's two-component click, Baltimore's reversing attack, and other research motifs without
  checking a fighter id. `homing` separately controls whether a projectile tracks its target.
- `BlockOptions.onHit` composes effects. A reposition can place its strike behind a target; a
  projectile can carry a stun; a zone can apply a modifier. These combinations need no new block
  kinds.
- `delay` is measured in simulation ticks from special release. `repeat` is the number of
  additional activations, spaced one simulation tick apart. `onHit` runs for each successful
  contact. `ignoresBlock` bypasses the ordinary guard. These shared rules make sequences data-led.
- `scaleWith: "damageTaken"` adds the owning fighter's match-round health loss to the block's
  authored damage. It is used by Goodenough's `FULLY CHARGED` attack. Meter refunds are capped at
  the meter maximum when M10 applies them.
- `modifier` supports temporary damage, speed, or defense multipliers on either combatant. This
  captures weakening, anticipation, and charge-up jokes without disabling arbitrary game actions.
- `De Novo Design` is a fixed, newly folded projectile followed by a strike. Its draft does not
  select a different weapon from combat context; that conditional behavior would need a new
  decision system and is not needed for the protein-design joke.
- `Particle Average` is a damage boost with a brief shield rather than spawning many Frank models.
  The block set has no summon or clone entity. The stronger-from-averaging joke survives without
  adding an entity system.
- `CRISPR Rewrite` weakens the opponent's outgoing damage for a short time. The schema does not
  mutate a fighter's body or disable named actions. Both would couple the effect to runtime
  abilities instead of a generic modifier.
- `Holographic Double` is a short shield followed by a retreat. The duplicate is the visual joke;
  the data does not create a second independently simulated fighter.
- `Growth Factor` uses a repeated arena zone and brief stuns for its spreading network. A
  branching line simulation is not needed for its gameplay effect.
- `GFP` lowers defense while a later presentation effect supplies the fluorescent reveal. Making
  hidden state, visibility, or player input depend on fluorescence is unnecessary.

## Attack stat profiles

The three existing fighters retain their current ordinary attacks. Warburg's heavy attack is
copied exactly from `src/match.ts`. New fighters use three readable starting profiles; these are
starting values for M32's balance diagnostic, not a competitive ranking.

| Profile | Light | Heavy |
| --- | --- | --- |
| Standard | 22 ticks; active 10-15; reach 1.8; damage 10 (2 blocked); stun 18; knockback 0.25 | 36 ticks; active 15-22; reach 2.2; damage 24 (5 blocked); stun 70; knockback 0.65 |
| Quick | 19 ticks; active 8-13; reach 1.8; damage 9 (2 blocked); stun 15; knockback 0.2 | 32 ticks; active 13-20; reach 2.05; damage 21 (4 blocked); stun 62; knockback 0.55 |
| Power | Standard light | 40 ticks; active 17-25; reach 2.35; damage 28 (6 blocked); stun 72; knockback 0.75 |
| Reach | 22 ticks; active 10-15; reach 2.0; damage 10 (2 blocked); stun 18; knockback 0.25 | 38 ticks; active 16-23; reach 2.6; damage 22 (5 blocked); stun 68; knockback 0.6 |

## Scope note

Franklin remains one of the three original game fighters, but she was not a Nobel laureate. The
25-fighter target is the three existing fighters plus 22 laureates. Captions and game effects are
fictional riffs; the completed dossiers document each new laureate's research connection.
