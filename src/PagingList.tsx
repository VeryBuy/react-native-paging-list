import React, { Component, createRef } from 'react';
import {
  FlatList,
  FlatListProps,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  View,
} from 'react-native';

type ExternalListComponent = {
  new (props): Component;
};

type ScrollEvent = NativeSyntheticEvent<NativeScrollEvent>;

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

  private _listRef = createRef<any>();
  private _activeIndex: number = 0;

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

  get _dataLength() {
    const { data } = this.props;

    return data?.length || 0;
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

  private _getScrollOffset = (event: ScrollEvent) => {
    return event?.nativeEvent?.contentOffset?.x || 0;
  };

  private _getActiveIndex = (offset: number) => {
    const { itemWidth } = this.props;

    return offset / itemWidth;
  };

  private _onScroll = (event: ScrollEvent) => {
    const scrollOffset = this._getScrollOffset(event);
    const nextActiveIndex = this._getActiveIndex(scrollOffset);
    const isReached = nextActiveIndex === Math.floor(nextActiveIndex);

    if (isReached) {
      this._activeIndex = nextActiveIndex;
      // TODO: onBeforeSnapToItem function
    }

    if (typeof this.props.onScroll === 'function') {
      this.props.onScroll(event);
    }
  };

  private _snapToIndex = (index: number) => {
    if (this._listRef?.current) {
      this._listRef.current.scrollToIndex({ index });
    }
  };

  public snapToPrev = () => {
    if (this._activeIndex === 0) {
      return;
    }

    this._snapToIndex(this._activeIndex - 1);
  };

  public snapToNext = () => {
    if (this._activeIndex === this._dataLength - 1) {
      return;
    }

    this._snapToIndex(this._activeIndex + 1);
  };

  public snapToItem = (index: number) => {
    this._snapToIndex(index);
  };

  render() {
    const {
      style,
      externalListComponent,
      sliderWidth,
      itemWidth,
      onScroll,
      ...others
    } = this.props;

    const List = externalListComponent
      ? (externalListComponent as ExternalListComponent)
      : FlatList;

    return (
      <List
        onScroll={this._onScroll}
        ref={this._listRef}
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
    );
  }
}
