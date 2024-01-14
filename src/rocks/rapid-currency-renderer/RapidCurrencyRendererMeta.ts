import { RockMeta } from "@ruiapp/move-style";

export default {
  $type: "rapidCurrencyRenderer",

  slots: {
  },

  propertyPanels: [
    {
      $type: "componentPropPanel",
      setters: [
        {
          $type: "textPropSetter",
          label: "defaultText",
          propName: "defaultText",
        },
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
        {
          $type: "selectPropSetter",
          label: "roundingMode",
          propName: "roundingMode",
          options: [
            {
              label: "halfExpand(default)",
              value: "halfExpand",
            },
            {
              label: "floor",
              value: "floor",
            },
            {
              label: "ceil",
              value: "ceil",
            },
          ],
        },
      ],
    },
  ],
} as RockMeta;