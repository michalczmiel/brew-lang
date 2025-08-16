import * as ohm from "ohm-js";

export const grammar = ohm.grammar(String.raw`
  BrewLang {
    recipe = (step | temperature | water | dose | newline)*

    dose = "dose" " " number
    temperature = "temperature" " " (range | number)+ newline?
    water = "water" " " number newline?

    step = "step" " " "{" newline? instruction+ " "* "}"
    instruction = " "* (start | stepEnd | pour) newline

    stepEnd = "end" " " duration
    start = "start" " " duration
    pour = "pour" " " number

    newline = "\n"

    number = real_number | whole_number
    whole_number = digit+
    real_number = digit+ "." digit+

    range = number "." "." number
    duration = whole_number ":" whole_number
  }
`);
