import { RockMeta } from "@ruiapp/move-style";

export default {
  $type: "rapidNumberRenderer",

  slots: {
  },

  propertyPanels: [
    {
      $type: "componentPropPanel",
      setters: [
        {
          $type: "switchPropSetter",
          label: "usingThousandSeparator",
          propName: "usingThousandSeparator",
        },
        {
          $type: "numberPropSetter",
          label: "decimalPlaces",
          propName: "decimalPlaces",
        },
      ],
    },
  ],
} as RockMeta;