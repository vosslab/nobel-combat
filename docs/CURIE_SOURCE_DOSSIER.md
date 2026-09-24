# Marie Curie source dossier

## Scope

This dossier defines one bounded combat motif for the second Nobel fighter. It preserves the
existing deterministic `Match` contract and treats Curie's laboratory work as the source of a
fictional game rhythm. It does not model radiation, make a health claim, or represent her research
as a deliberate means of harming people.

## Source basis

- Curie's 1911 Nobel lecture states that each chemical separation was followed by measurement of
  the products' activity. She explains that repeated fractional crystallization concentrated radium
  salts while progress was monitored by measurements. [Marie Curie, "Radium and the New Concepts in
  Chemistry" (1911)](https://www.nobelprize.org/prizes/chemistry/1911/marie-curie/lecture/)
- The Nobel history records the division of work: Marie carried out chemical separations and Pierre
  measured the results after successive steps. [Marie and Pierre Curie and the discovery of polonium
  and radium](https://www.nobelprize.org/prizes/themes/marie-and-pierre-curie-and-the-discovery-of-polonium-and-radium/)
- The 1911 Chemistry prize recognizes the discovery of polonium and radium, isolation of radium,
  and study of its nature and compounds. [Nobel Prize in Chemistry 1911
  summary](https://www.nobelprize.org/prizes/chemistry/1911/summary/)

## Concrete combat motif

**Separation Step** is Curie's single direct signature move. It uses the existing `light + block`
chord, which maps to J+L on keyboard and south button plus right shoulder on a standard gamepad.
The animation is a compact forward hand strike with no emitted projectile, beam, radiation effect,
sample, or contact hazard. Its name and staged timing refer to the documented sequence of separation
and measurement; the attack itself is fictional game presentation.

At 60 Hz, the move sets its attack state to 24 ticks. Its active window is the seven ticks with 18
through 12 ticks remaining, so first contact occurs on the sixth tick after input. It has 12 ticks
of recovery after the active window, a 1.95-unit reach, and one hit per swing. An unblocked contact
deals 16 damage, applies 16 ticks of hit stun, and causes no knockdown. A held block takes 3 damage
and retains the existing 8-tick block response. Activation sets a 72-tick cooldown; a whiff still
completes its full recovery and cooldown.

The proposed values make a narrow, timing-led option. It is slightly longer reaching and stronger
than the ordinary 22-tick light (1.8 units, 10 damage, 2 blocked damage, 18 hit-stun ticks), but it
does less damage than Warburg's 16-tick Lactate Drive (18 damage, 2.0 units, 44-tick cooldown) and
is far below Warburg's Oxygen Transfer heavy (28 damage, 2.45 units, knockdown). It has no movement
boost, damage persistence, meter, status effect, healing, stacking, or shared ability framework.

## Deterministic implementation trace

| Check          | Expected result                                                                                                                 |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Input          | A Curie fighter receives `light + block`; other roles keep their existing chord behavior.                                       |
| Start          | State is `light`, remaining ticks are 24, hit flag is clear, and cooldown is set to 72.                                         |
| Startup        | No hit before the sixth post-input tick; fighter position is unchanged by the move.                                             |
| Active contact | At 1.95 units or less in front of Curie, one unblocked hit changes HP by 16 and sets 16 hit-stun ticks.                         |
| Held block     | One blocked contact changes HP by 3 and preserves the existing 8-tick block response.                                           |
| Whiff          | A target at 1.96 units retains HP; the swing cannot hit later in its active window.                                             |
| Recovery       | State returns to idle after the seven active ticks and 12 recovery ticks; cooldown prevents reactivation until it reaches zero. |
| Invariants     | HP remains in [0, 100], KO/round handling is unchanged, and one swing cannot produce repeated hits.                             |

## Evidence limits

- The sources establish a measurement-led chemical-separation method and the scientific work
  recognized by the 1911 prize. They do not establish a combat technique, animation, input chord,
  damage, or timing.
- The numeric values are balance hypotheses based on the existing `Match` values. C4 must preserve
  them in direct, fighter-specific code and validate the trace above before treating them as settled.
- The move deliberately avoids portraying radioactivity as a cure, a controllable weapon, or a
  health effect. Its visual cue should communicate a measured separation sequence without simulating
  radiation exposure.
