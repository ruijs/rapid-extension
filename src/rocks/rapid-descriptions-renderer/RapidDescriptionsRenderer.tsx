import { Rock, RockConfig } from "@ruiapp/move-style";
import { renderRockSlot, renderRockChildren, renderRock } from "@ruiapp/react-renderer";
import { Descriptions, DescriptionsProps } from "antd";
import RapidDescriptionsRendererMeta from "./RapidDescriptionsRendererMeta";
import { RapidDescriptionsRockConfig } from "./rapid-descriptions-renderer-types";
import { each, get } from "lodash";
import RapidExtensionSetting from "../../RapidExtensionSetting";

export default {
  $type: "rapidDescriptionsRenderer",

  Renderer(context, props) {
    const antdProps: DescriptionsProps = {
      bordered: props.bordered,
      size: props.size,
      colon: props.colon,
      column: props.column || 1,
    };

    const itemsConfigs: any[] = [];
    each(props.items, (item) => {
      const rendererType = item.rendererType || RapidExtensionSetting.getDefaultRendererTypeOfFieldType(item.valueFieldType);
      const defaultRendererProps = RapidExtensionSetting.getDefaultRendererProps(item.valueFieldType, rendererType);

      const itemDisplayRockConfig: RockConfig = {
        $id: `${props.$id}-${item.code}-display`,
        $type: rendererType,
        ...defaultRendererProps,
        ...item.rendererProps,
        value: get(props.value, item.code),
      };

      const itemConfig: any = {
        $id: `${props.$id}-${item.code}`,
        $type: 'antdDescriptionsItem',
        key: item.code,
        label: item.label || item.code,
        children: itemDisplayRockConfig,
      };

      itemsConfigs.push(itemConfig);
    });


    const rockConfig: RockConfig = {
      $id: props.$id,
      $type: 'antdDescriptions',
      ...antdProps,
      children: itemsConfigs,
    };

    return renderRock({context, rockConfig});
  },

  ...RapidDescriptionsRendererMeta
} as Rock<RapidDescriptionsRockConfig>;