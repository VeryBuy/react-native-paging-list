import React, { Component } from 'react';
import { FlatList, FlatListProps, Platform, View } from 'react-native';

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
  externalListComponent?: ExternalListComponent;
  sliderWidth: number;
  itemWidth: number;
}

export default class PagingList<ExtendProps> extends Component<
  Props & ExtendProps
> {
  static defaultProps: Partial<Props> = {
    snapToAlignment: 'center',
  };

  get snapToOffsets() {
    const { itemWidth } = this.props;

    return this.props.data?.map((_x, i) => i * itemWidth);
  }

  get Footer() {
    const { snapToAlignment, sliderWidth, itemWidth } = this.props;

    if (snapToAlignment !== 'start') {
      return null;
    }

    return (
      <View
        style={{
          width: sliderWidth - itemWidth,
        }}
      />
    );
  }

  /**
   * This is used to fix the incorrect offset if pagingEnabled is true on web
   */
  private CellRendererComponent = ({ index, ...props }) => {
    if (Platform.OS === 'web') {
      const { onLayout, itemWidth, ...other } = props;

      const fixOffsetOnLayout = e => {
        if (onLayout) {
          onLayout({
            ...e,
            nativeEvent: {
              ...e.nativeEvent,
              layout: {
                ...e.nativeEvent.layout,
                x: index * itemWidth,
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
    const {
      style,
      externalListComponent,
      sliderWidth,
      itemWidth,
      ...others
    } = this.props;

    const List = externalListComponent
      ? (externalListComponent as ExternalListComponent)
      : FlatList;

    return (
      <View>
        <List
          style={style}
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
