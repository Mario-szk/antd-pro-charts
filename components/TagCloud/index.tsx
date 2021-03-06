import React from 'react';
import { Chart, Geom, Coord, Shape } from 'bizcharts';
import DataSet from '@antv/data-set';
import Debounce from 'lodash-decorators/debounce';
import Bind from 'lodash-decorators/bind';
import classNames from 'classnames';
import autoHeight from '../autoHeight';
import './index.less';

/* eslint no-underscore-dangle: 0 */
/* eslint no-param-reassign: 0 */

const imgUrl = 'https://gw.alipayobjects.com/zos/rmsportal/gWyeGLCdFFRavBGIDzWk.png';


export interface ITagCloudProps {
  data: Array<{
    name: string;
    value: number;
  }>;
  height: number;
  style?: React.CSSProperties;
  className?: string;
}

class TagCloud extends React.Component<ITagCloudProps, any> {
  state = {
    dv: null,
    w: 0,
    h: 0
  };

  isUnmount: boolean;
  requestRef: number;
  root: HTMLDivElement;
  imageMask: any;

  componentDidMount() {
    requestAnimationFrame(() => {
      this.initTagCloud();
      this.renderChart();
    });
    window.addEventListener('resize', this.resize, { passive: true });
  }

  componentDidUpdate(preProps: ITagCloudProps) {
    const { data } = this.props;
    if (JSON.stringify(preProps.data) !== JSON.stringify(data)) {
      this.renderChart(this.props);
    }
  }

  componentWillUnmount() {
    this.isUnmount = true;
    window.cancelAnimationFrame(this.requestRef);
    window.removeEventListener('resize', this.resize);
  }

  resize = () => {
    this.requestRef = requestAnimationFrame(() => {
      this.renderChart();
    });
  };

  saveRootRef = (node: HTMLDivElement) => {
    this.root = node;
  };

  initTagCloud = () => {
    function getTextAttrs(cfg: any) {
      return Object.assign(
        {},
        {
          fillOpacity: cfg.opacity,
          fontSize: cfg.origin._origin.size,
          rotate: cfg.origin._origin.rotate,
          text: cfg.origin._origin.text,
          textAlign: 'center',
          fontFamily: cfg.origin._origin.font,
          fill: cfg.color,
          textBaseline: 'Alphabetic',
        },
        cfg.style
      );
    }

    // 给point注册一个词云的shape
    if (Shape.registerShape) {
      Shape.registerShape('point', 'cloud', {
        drawShape(cfg: any, container: any) {
          const attrs = getTextAttrs(cfg);
          return container.addShape('text', {
            attrs: Object.assign(attrs, {
              x: cfg.x,
              y: cfg.y,
            }),
          });
        },
      });
    }
  };

  @Bind()
  @Debounce(500)
  renderChart(nextProps?: ITagCloudProps) {
    // const colors = ['#1890FF', '#41D9C7', '#2FC25B', '#FACC14', '#9AE65C'];
    const { data, height } = nextProps || this.props;

    if (data.length < 1 || !this.root) {
      return;
    }

    const h = height * 4;
    const w = this.root.offsetWidth * 4;

    const onload = () => {
      const dv = new DataSet.View().source(data);
      const range = dv.range('value');
      const [min, max] = range;
      dv.transform({
        type: 'tag-cloud',
        fields: ['name', 'value'],
        imageMask: this.imageMask,
        font: 'Verdana',
        size: [w, h], // 宽高设置最好根据 imageMask 做调整
        padding: 5,
        timeInterval: 5000, // max execute time
        rotate() {
          return 0;
        },
        fontSize(d: any) {
          // eslint-disable-next-line
          return Math.pow((d.value - min) / (max - min), 2) * (70 - 20) + 20;
        },
      });

      if (this.isUnmount) {
        return;
      }

      this.setState({
        dv,
        w,
        h,
      });
    };

    if (!this.imageMask) {
      this.imageMask = new Image();
      this.imageMask.crossOrigin = '';
      this.imageMask.src = imgUrl;

      this.imageMask.onload = onload;
    } else {
      onload();
    }
  }

  render() {
    const { className, height } = this.props;
    const { dv, w, h } = this.state;

    return (
      <div
        className={classNames("tagCloud", className)}
        style={{ width: '100%', height }}
        ref={this.saveRootRef}
      >
        {dv && (
          <Chart
            width={w}
            height={h}
            data={dv}
            padding={0}
            scale={{
              x: { nice: false },
              y: { nice: false },
            }}
          >
            <Coord reflect="y" />
            <Geom type="point" position="x*y" color="text" shape="cloud" />
          </Chart>
        )}
      </div>
    );
  }
}

export default autoHeight()(TagCloud);