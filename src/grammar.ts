import * as ohm from "ohm-js";

export const grammar = ohm.grammar(String.raw`
  BrewLang {
    recipe = (method | step | temperature | water | dose | comment | newline)*

    method = "method" " " (~newline any)+ newline?
    dose = "dose" " " number newline?
    temperature = "temperature" " " (range | number)+ newline?
    water = "water" " " number newline?

    step = "at" " " duration_number newline? instruction+ "end" newline?
    instruction = " "* (time_instruction | pour | comment) (newline | " " | &"end")

    time_instruction = "duration" " " duration_number
    pour = "pour" " " number

    comment = "#" (~newline any)*
    newline = "\n"

    range = whole_number "." "." whole_number

    number = real_number | whole_number
    whole_number = digit+
    real_number = digit+ "." digit+

    duration_number = whole_number ":" whole_number
  }
`);
