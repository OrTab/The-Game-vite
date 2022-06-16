import { GenericObject } from './game';

export const getRandomInt = (min: number, max: number): number => {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

export const getRandomColor = (): string => {
  return '#' + Math.random().toString(16).substr(-6);
};

export const createImage = (
  imgSrc: string,
  onLoadFunc?: () => void
): HTMLImageElement => {
  const src = imgSrc.replace('build', 'build/');
  const img = new Image();
  img.src = src;
  if (onLoadFunc) img.onload = onLoadFunc;
  return img;
};

export const formatNumber = (
  number: number | string,
  sepNum: number = 3,
  separator: string = ','
) => {
  number = number.toString();
  let formattedNumber = '';
  let counter = number.length - 1;

  for (let i = 0; i < number.length; i++) {
    formattedNumber += number[i];
    if (counter % sepNum === 0 && counter !== 0) {
      formattedNumber += separator;
    }
    counter--;
  }
  return formattedNumber;
};

export const sleep = (delay: number) =>
  new Promise((resolve) => setTimeout(resolve, delay));

export const factory = <T extends GenericObject>(
  TCreator: new (...args: unknown[]) => T,
  args: unknown[]
): T => {
  return new TCreator(args);
};

export const runPolyfill = () => {
  EventTarget.prototype.addEventListenerBase =
    EventTarget.prototype.addEventListener;
  const listenersMap = new Map();
  EventTarget.prototype.addEventListener = function (type, listener) {
    let listenersOfTarget = listenersMap.get(this);
    if (listenersOfTarget) {
      if (listenersOfTarget[type]) {
        listenersOfTarget[type] = [...listenersOfTarget[type], listener];
      } else {
        listenersOfTarget[type] = [listener];
      }
      listenersMap.set(this, listenersOfTarget);
    } else {
      listenersMap.set(this, {
        [type]: [listener],
      });
    }
    this.addEventListenerBase(type, listener);
  };

  EventTarget.prototype.removeEventListeners = function ({
    type = null,
    shouldRemoveAll = false,
  }) {
    const handleRemoveListeners = (
      type: string,
      target: EventListenerOrEventListenerObject[]
    ) => {
      target.forEach((listener: EventListenerOrEventListenerObject) => {
        this.removeEventListener(type, listener);
      });
    };

    const listenersOfTarget = listenersMap.get(this);
    if (listenersOfTarget) {
      if (shouldRemoveAll && !type) {
        for (const type in listenersOfTarget) {
          handleRemoveListeners(type, listenersOfTarget[type]);
        }
        listenersMap.delete(this);
      } else if (type && listenersOfTarget[type]) {
        handleRemoveListeners(type, listenersOfTarget[type]);
        const newListenersOfType = Object.keys(listenersOfTarget).reduce(
          (acc: Record<string, {}>, currType) => {
            if (currType === type) return acc;
            acc[currType] = listenersOfTarget[currType];
            return acc;
          },
          {}
        );
        listenersMap.set(this, newListenersOfType);
      }
    }
  };

  if (!Array.prototype.at) {
    Array.prototype.at = function (idx) {
      if (idx < 0) return this[this.length + idx];
      return this[idx];
    };
  }

  if (!window.structuredClone) {
    window.structuredClone = (obj) => JSON.parse(JSON.stringify(obj));
  }
};
