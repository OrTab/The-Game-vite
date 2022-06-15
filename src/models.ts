declare global {
  interface Window {
    structuredClone: <T>(obj: T) => T;
  }
}

export enum Values {
  X_DIFF = 4,
  Y_DIFF = 20,
  MinXDiffBetweenPlatform = 400,
  MinXDiffBetweenFloor = 250,
  MaxJumpsWhileInAir = 2,
  NumberOfFramesToMovePlayerImage = 2,
  NumberOfFramesToIncreaseDistance = 5,
  NumberOfImages = 4,
  NumberOfPlayerFramesInImage = 11,
  RangeToIncreaseSpeed = 120,
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
    width: 89,
    height: 103,
  },
  playerImage: {
    image: null,
    currPlayerImageFrame: 0,
    currPlayerImageFramePosition: 0,
  },
};
