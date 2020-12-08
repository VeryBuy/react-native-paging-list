import React, { Component } from 'react';
import { FlatList, FlatListProps, Platform, View } from 'react-native';

export interface ItemStyle {
  width: number;
  height: number;
  margin: number;
}

type ExternalListComponent = {
  new (props): Component;
};

export interface Props
  extends Omit<
    FlatListProps<any>,
    | 'pagingEnabled'
    | 'showsHorizontalScrollIndicator'
    | 'horizontal'
    | 'CellRendererComponent'
    | 'decelerationRate'
    | 'ListFooterComponent'
  > {
  itemStyle: ItemStyle;
  data: string[];
  externalListComponent?: ExternalListComponent;
}

export default class PagingList<ExtendProps> extends Component<
  Props & ExtendProps
> {
  static defaultProps: Partial<Props> = {
    snapToAlignment: 'center',
  };

  state = {
    containerWidth: 0,
  };

  get snapToOffsets() {
    const { itemStyle } = this.props;

    return this.props.data.map(
      (_x, i) => i * (itemStyle.width + itemStyle.margin)
    );
  }

  get Footer() {
    const { itemStyle, snapToAlignment } = this.props;

    if (snapToAlignment !== 'start') {
      return null;
    }

    return (
      <View
        style={{
          width: this.state.containerWidth - itemStyle.width - itemStyle.margin,
          height: itemStyle.height,
        }}
      />
    );
  }

  /**
   * This is used to fix the incorrect offset if pagingEnabled is true on web
   */
  private CellRendererComponent = ({ index, ...props }) => {
    if (Platform.OS === 'web') {
      const { onLayout, ...other } = props;

      const fixOffsetOnLayout = e => {
        if (onLayout) {
          onLayout({
            ...e,
            nativeEvent: {
              ...e.nativeEvent,
              layout: {
                ...e.nativeEvent.layout,
                x:
                  index *
                  (this.props.itemStyle.width + this.props.itemStyle.margin),
              },
            },
          });
        }
      };

      return <View {...other} onLayout={fixOffsetOnLayout} />;
    }

    return <View {...props} />;
  };

  render() {
    const { itemStyle, style, externalListComponent, ...others } = this.props;

    const List = externalListComponent
      ? (externalListComponent as ExternalListComponent)
      : FlatList;

    return (
      <View
        onLayout={e =>
          this.setState({ containerWidth: e.nativeEvent.layout.width })
        }
      >
        <List
          style={[
            {
              minHeight: itemStyle.height,
              maxHeight: itemStyle.height,
            },
            style,
          ]}
          snapToOffsets={this.snapToOffsets}
          ListFooterComponent={this.Footer}
          showsHorizontalScrollIndicator={false}
          CellRendererComponent={this.CellRendererComponent}
          decelerationRate="fast"
          pagingEnabled
          horizontal
          {...others}
        />
      </View>
    );
  }
}
