export enum Values {
  X_DIFF = 4,
  Y_DIFF = 20,
  MinXDiffBetweenPlatform = 400,
  MaxJumpsWhileInAir = 2,
  NumberOfFramesToMovePlayerImage = 2,
  NumberOfFramesToIncreaseDistance = 5,
  NumberOfImages = 4,
  NumberOfPlayerImageFrames = 11,
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

export interface PlayerProperties {
  position: Position;
  size: Size;
}

export const InitialPlayerProperties = {
  position: {
    x: 100,
    y: 100,
  },
  size: {
    width: 89,
    height: 103,
  },
};
