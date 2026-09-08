import { DesignLayer } from '../types';

/**
 * Application logo taken from EditorSuite brand logo
 */
export const DEFAULT_APP_LOGO = '/logo-editorsuite.svg';

export const createInitialLayers = (): DesignLayer[] => [
  {
    id: 'layer-editorsuite-logo',
    name: 'EditorSuite Logo',
    dataUrl: DEFAULT_APP_LOGO,
    x: 0.357511, // left: 35.7511%
    y: 0.288879, // top: 28.8879%
    width: 0.05, // width: 5%
    height: 0.05, // height: 5%
    rotation: 0,
    opacity: 1,
    visible: true,
  },
];
