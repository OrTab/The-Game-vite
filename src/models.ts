declare global {
  interface Window {
    structuredClone: <T>(obj: T) => T;
  }

  interface EventTarget {
    addEventListenerBase: typeof EventTarget.prototype.addEventListener;
    removeEventListeners: ({
      type,
      shouldRemoveAll,
    }: {
      type?: keyof WindowEventMap | null;
      shouldRemoveAll?: boolean;
    }) => void;
  }
}

export type TObjectsType = 'floor' | 'platform';
export interface IObjectCreationParams {
  minX: number;
  maxX?: number;
  img: HTMLImageElement;
  type: TObjectsType;
}

export enum Values {
  X_DIFF = 5,
  Y_DIFF = 22,
  Gravity = 1,
  MinXDiffBetweenPlatform = 400,
  MinXDiffBetweenFloor = 250,
  MaxJumpsWhileInAir = 2,
  NumberOfFramesToMovePlayerImage = 0,
  NumberOfFramesToIncreaseDistance = 4,
  NumberOfImages = 5,
  NumberOfPlayerFramesInImage = 30,
  RangeToIncreaseSpeed = 30,
  PlayerImageFrameWidth = 341,
  PlayerImageFrameHeight = 400,
}

export interface Position {
  x: number;
  y: number;
}

export interface Velocity {
  x: number;
  y: number;
}
export interface Size {
  width: number;
  height: number;
}

type Pressed = { isPressed: boolean };
export interface PressedKeys {
  right: Pressed;
  left: Pressed;
}

export interface IPlayerImage {
  image: HTMLImageElement | null;
  currPlayerImageFrame: number;
  currPlayerImageFramePosition: number;
}

export interface IPlayer {
  position: Position;
  size: Size;
  playerImage: IPlayerImage;
}

export const InitialPlayerProperties: IPlayer = {
  position: {
    x: 100,
    y: 100,
  },
  size: {
    width: 127.875,
    height: 128,
  },
  playerImage: {
    image: null,
    currPlayerImageFrame: 0,
    currPlayerImageFramePosition: 0,
  },
};
