import * as ohm from "ohm-js";

export const grammar = ohm.grammar(String.raw`
  BrewLang {
    recipe = (method | step | temperature | water | dose | comment | newline)*

    method = "method" " " (~newline any)+ newline?
    dose = "dose" " " number newline?
    temperature = "temperature" " " (range | number)+ newline?
    water = "water" " " number newline?

    step = "step" " " "{" newline? instruction+ " "* "}"
    instruction = " "* (time_instruction | pour | comment) newline

    time_instruction = ("duration" | "start" | "finish") " " duration_number
    pour = "pour" " " number

    comment = "#" (~newline any)*
    newline = "\n"

    number = real_number | whole_number
    whole_number = digit+
    real_number = digit+ "." digit+

    range = number "." "." number
    duration_number = whole_number ":" whole_number
  }
`);
