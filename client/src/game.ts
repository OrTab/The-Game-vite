import './styles/style.css';
import {
  Position,
  PressedKeys,
  Size,
  Values,
  Velocity,
  InitialPlayerProperties,
  IPlayer,
  IObjectCreationParams,
  TGameObjectsType,
  TLastPressedKeys,
  getPlayerImage,
} from './models';
import { getRandomInt, createImage, sleep, runPolyfill } from './utils';
import platform from './assets/platform.png';
import background from './assets/background.png';
import floor from './assets/floor.png';
import spriteRunRight from './assets/spriteRunRight.png';
import spriteRunLeft from './assets/spriteRunLeft.png';
import spriteStandRight from './assets/spriteStandRight.png';
import spriteStandLeft from './assets/spriteStandLeft.png';

const playerRunImgRight = createImage(spriteRunRight, shouldInitGame);
const playerRunImgLeft = createImage(spriteRunLeft, shouldInitGame);
const playerStandImgLeft = createImage(spriteStandLeft, shouldInitGame);
const playerStandImgRight = createImage(spriteStandRight, shouldInitGame);
const backgroundImage = createImage(background, shouldInitGame);
const floorImage = createImage(floor, shouldInitGame);
const platformImage = createImage(platform, shouldInitGame);

let numOfLoadedImages = 0;
let requestAnimationId = 0;

runPolyfill();
const canvas = document.querySelector('canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
const restartBtn = document.querySelector(
  '.game-over .btn'
) as HTMLButtonElement;
const gameOverModal = document.querySelector('.game-over') as HTMLDivElement;
restartBtn.addEventListener('click', onRestart);

class Game {
  private velocityXDiff: number = Values.VelocityXDiff;
  private velocityYDiff: number = Values.VelocityYDiff;
  readonly gravity: number = Values.Gravity;
  private jumpsCounter: number = 0;
  private player: IPlayer;
  private velocity: Velocity = {
    x: 0,
    y: 10,
  };
  private keys: PressedKeys = {
    right: { isPressed: false },
    left: { isPressed: false },
  };
  private lastPressedKey: TLastPressedKeys = 'right';
  private platforms: GenericObject[] = [];
  private genericObjects: GenericObject[] = [];
  private floors: GenericObject[] = [];
  private numberOfFramesToIncreaseDistance = 0;
  private lastDistanceToIncreaseSpeed: number = 0;
  private distance: number = 0;
  private numberOfFramesToMovePlayerImage: number = 0;
  private platformMovementXDiff: number = Values.InitialPlatformMovementXDiff;
  private floorMovementXDiff: number = Values.InitialFloorMovementXDiff;

  constructor(player: IPlayer) {
    this.player = player;
    window.addEventListener('resize', () => {
      this.resize(false);
    });
    window.addEventListener('keydown', this.handleOnKey.bind(this));
    window.addEventListener('keyup', this.handleOnKey.bind(this));
    this.resize(true);
    this.initObjects();
    this.animate();
  }

  private set setKeyIsPressed({
    side,
    isPressed,
  }: {
    side: 'left' | 'right';
    isPressed: boolean;
  }) {
    this.keys[side].isPressed = isPressed;
    this.handlePlayerImage();
  }

  private get bothKeysPressed() {
    return this.keys.right.isPressed && this.keys.left.isPressed;
  }

  private get isLeftOrRightPressed() {
    return this.keys.right.isPressed || this.keys.left.isPressed;
  }

  private get noKeysPressed() {
    return !this.keys.left.isPressed && !this.keys.right.isPressed;
  }

  private get canGoLeft() {
    return (
      this.keys.left.isPressed &&
      !this.bothKeysPressed &&
      this.player.position.x > 100
    );
  }

  private get atPositionToIncreaseSpeed() {
    return this.player.position.x >= canvas.width / 1 / 2;
  }

  private get canGoRight() {
    return (
      !this.bothKeysPressed &&
      this.keys.right.isPressed &&
      !this.atPositionToIncreaseSpeed
    );
  }

  private get isOnFloor() {
    return this.floors.some(this.checkIsOnObject.bind(this));
  }

  private get isOnPlatform() {
    return this.platforms.some(this.checkIsOnObject.bind(this));
  }

  private initObjects() {
    this.platforms = this.getGameObjects({
      minX: 0,
      maxX: 500,
      img: platformImage,
      type: 'platform',
    });

    this.genericObjects[0] = new GenericObject(
      { x: -1, y: -1 },
      { height: canvas.height, width: canvas.width },
      backgroundImage
    );
    this.floors = this.getGameObjects({
      minX: 0,
      img: platformImage,
      type: 'floor',
    });
  }

  //main function , control the flow
  private animate() {
    requestAnimationId = requestAnimationFrame(this.animate.bind(this));
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    this.genericObjects.forEach((obj) => obj.draw());
    this.handleFloor();
    this.handlePlatforms();
    this.handleDistance();
    this.updateVelocity();
    this.updatePlayerPosition();
  }

  private handleFloor() {
    this.floors.forEach((floor, idx) => {
      if (
        floor.position.x + floor.size.width + canvas.width <
        this.player.position.x
      ) {
        setTimeout(() => {
          this.floors.splice(idx, 1);
        }, 0);
      }

      if (this.checkIsOnObject(floor) && !this.keys.right.isPressed) {
        this.player.position.x -= this.floorMovementXDiff;
      }

      const diff = this.keys.right.isPressed
        ? -this.floorMovementXDiff
        : this.keys.left.isPressed
        ? +this.floorMovementXDiff - 1
        : -this.floorMovementXDiff;
      floor.position.x += diff;
      floor.draw();
    });
    this.shouldAddMoreFloors();
  }

  private shouldAddMoreFloors() {
    const secondFromLastFloor = this.floors.at(-2);

    if (
      secondFromLastFloor &&
      this.player.position.x >= secondFromLastFloor.position.x
    ) {
      const lastFloor = this.floors.at(-1);
      if (lastFloor) {
        const floors =
          this.getGameObjects({
            minX:
              lastFloor.position.x +
              lastFloor.size.width +
              getRandomInt(120, 350),
            img: platformImage,
            type: 'floor',
          }) || [];
        this.floors.push(...floors);
      }
    }
  }

  private updateVelocity() {
    if (this.isOnFloor || this.isOnPlatform) {
      this.velocity.y = 0;
      this.jumpsCounter = 0;
    } else {
      this.velocity.y += this.gravity;
    }
    if (this.canGoRight) {
      this.velocity.x = this.velocityXDiff;
    } else if (this.canGoLeft) {
      this.velocity.x = -this.velocityXDiff;
    } else this.velocity.x = 0;
  }

  private handlePlayerImage() {
    const { playerImage } = this.player;
    if (this.noKeysPressed) {
      playerImage.stand.image =
        this.lastPressedKey === 'right'
          ? playerStandImgRight
          : playerStandImgLeft;
    } else if (this.bothKeysPressed || this.keys.right.isPressed) {
      playerImage.run.image = playerRunImgRight;
    } else if (this.keys.left.isPressed)
      playerImage.run.image = playerRunImgLeft;
  }

  private updatePlayerPosition() {
    const {
      position,
      size: { width },
    } = this.player;
    position.y += this.velocity.y;
    position.x += this.velocity.x;

    if (position.y > canvas.height || position.x + width < 0) {
      handleGameOver();
    }
    this.drawPlayer();
  }

  private drawPlayer() {
    const {
      position: { x, y },
      playerImage,
    } = this.player;

    const currentImage = this.noKeysPressed
      ? playerImage.stand
      : playerImage.run;

    this.player.size = currentImage.size;

    ctx.drawImage(
      currentImage.image || playerStandImgRight,
      currentImage.currPlayerImageFramePosition,
      0,
      this.noKeysPressed
        ? Values.PlayerStandImageFrameWidth
        : Values.PlayerRunImageFrameWidth,
      this.noKeysPressed
        ? Values.PlayerStandImageFrameHeight
        : Values.PlayerRunImageFrameHeight,
      x,
      y,
      currentImage.size.height,
      currentImage.size.width
    );

    this.numberOfFramesToMovePlayerImage++;
    if (
      this.numberOfFramesToMovePlayerImage >
      Values.NumberOfFramesToMovePlayerImage
    ) {
      this.handlePlayerImageFrame();
      this.numberOfFramesToMovePlayerImage = 0;
    }
  }

  private checkIsOnObject(object: GenericObject) {
    const {
      size: { width, height },
      position,
    } = this.player;

    return (
      position.y + height <= object.position.y &&
      position.y + height + this.velocity.y >= object.position.y &&
      position.x + width / 2 <= object.position.x + object.size.width &&
      position.x + width / 2 >= object.position.x
    );
  }

  private handlePlatforms() {
    this.platforms.forEach((platform, idx) => {
      if (
        platform.position.x + platform.size.width + canvas.width <
        this.player.position.x
      ) {
        setTimeout(() => {
          this.platforms.splice(idx, 1);
        }, 0);
      }
      platform.position.x -= this.platformMovementXDiff;

      if (this.checkIsOnObject(platform) && !this.keys.right.isPressed) {
        this.player.position.x -= this.platformMovementXDiff;
      }

      platform.draw();
    });

    this.shouldAddMorePlatforms();
  }

  private shouldAddMorePlatforms() {
    const thirdFromLastPlatform = this.platforms.at(-3);
    if (
      thirdFromLastPlatform &&
      this.player.position.x >= thirdFromLastPlatform.position.x
    ) {
      const lastPlatform = this.platforms.at(-1);
      if (lastPlatform) {
        const { x: posX } = lastPlatform.position;
        const platforms =
          this.getGameObjects({
            minX: posX,
            maxX: posX + lastPlatform.size.width,
            img: platformImage,
            type: 'platform',
          }) || [];
        this.platforms.push(...platforms);
      }
    }
  }

  private getGameObjects({
    minX,
    maxX = 500,
    img,
    type,
  }: IObjectCreationParams) {
    const callbackPerType: {
      [type in TGameObjectsType]: () => GenericObject;
    } = {
      platform() {
        minX = getRandomInt(minX + Values.MinXDiffBetweenPlatform, maxX);
        maxX += 500;
        return new GenericObject(
          {
            x: minX,
            y: getRandomInt(320, canvas.height - 250),
          },
          {
            width: getRandomInt(150, 350),
            height: 30,
          },
          img
        );
      },
      floor() {
        const widthOfFloor =
          minX === 0 ? canvas.width - 300 : getRandomInt(250, 450);
        const platform = new GenericObject(
          {
            x: minX,
            y: canvas.height - 80,
          },
          {
            width: widthOfFloor,
            height: 80,
          },
          img
        );
        minX += widthOfFloor + getRandomInt(120, 350);
        return platform;
      },
    };
    return Array(5).fill('').map(callbackPerType[type]);
  }

  private async handleDistance() {
    this.numberOfFramesToIncreaseDistance++;
    if (
      this.numberOfFramesToIncreaseDistance <
        Values.NumberOfFramesToIncreaseDistance ||
      !this.atPositionToIncreaseSpeed
    ) {
      return;
    }
    this.distance++;
    this.numberOfFramesToIncreaseDistance = 0;
    if (
      this.distance - Values.RangeToIncreaseSpeed ===
      this.lastDistanceToIncreaseSpeed
    ) {
      this.lastDistanceToIncreaseSpeed = this.distance;
      this.platformMovementXDiff += 0.2;
      this.floorMovementXDiff += 0.2;
      await sleep(500);
      this.platformMovementXDiff += 0.1;
      this.floorMovementXDiff += 0.1;
      await sleep(500);
      this.platformMovementXDiff += 0.2;
      this.floorMovementXDiff += 0.2;
    }
  }

  private handlePlayerImageFrame() {
    const { playerImage } = this.player;
    switch (this.noKeysPressed) {
      case false:
        playerImage.run.currPlayerImageFramePosition =
          playerImage.run.currPlayerImageFrame *
          Values.PlayerRunImageFrameWidth;
        playerImage.run.currPlayerImageFrame++;
        if (
          playerImage.run.currPlayerImageFrame ===
          Values.NumberOfFramesInPlayerRunImage
        ) {
          playerImage.run.currPlayerImageFrame = 0;
        }
        break;
      case true:
        playerImage.stand.currPlayerImageFramePosition =
          playerImage.stand.currPlayerImageFrame *
          Values.PlayerStandImageFrameWidth;
        playerImage.stand.currPlayerImageFrame++;
        if (
          playerImage.stand.currPlayerImageFrame ===
          Values.NumberOfFramesInPlayerStandImage
        ) {
          playerImage.stand.currPlayerImageFrame = 0;
        }
        break;
    }
  }

  private handleOnKey({ code, type }: KeyboardEvent) {
    let velocityY = this.velocityYDiff;
    switch (code) {
      case 'ArrowUp':
      case 'Space':
        if (this.jumpsCounter >= Values.MaxJumpsWhileInAir) return;
        if (type === 'keydown') {
          this.jumpsCounter++;
          if (this.jumpsCounter > 0) velocityY -= 4;
          this.velocity.y = -velocityY;
        }
        break;
      case 'ArrowDown':
        if (type === 'keydown') {
          this.velocity.y += this.velocityYDiff;
        }
        break;
      case 'ArrowRight':
        this.lastPressedKey = 'right';
        this.setKeyIsPressed = { side: 'right', isPressed: type === 'keydown' };
        break;
      case 'ArrowLeft':
        this.lastPressedKey = 'left';
        this.setKeyIsPressed = { side: 'left', isPressed: type === 'keydown' };
        break;
    }
  }

  private resize(isStartGame: boolean) {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    if (!isStartGame) {
      this.genericObjects[0].size.height = canvas.height;
      this.genericObjects[0].size.width = canvas.width;
    }
  }
}

export class GenericObject {
  position: Position;
  size: Size;
  img: HTMLImageElement;
  constructor(position: Position, size: Size, image: HTMLImageElement) {
    this.position = position;
    this.size = size;
    this.img = image;
  }

  draw() {
    const {
      position: { x, y },
      size: { width, height },
      img,
    } = this;
    ctx.drawImage(img, x, y, width, height);
  }
}
function shouldInitGame() {
  numOfLoadedImages++;
  if (numOfLoadedImages === Values.NumberOfImages) {
    initGame();
  }
}

function initGame() {
  const initialProperties = window.structuredClone<IPlayer>(
    InitialPlayerProperties
  );
  initialProperties.playerImage = getPlayerImage();
  new Game(initialProperties);
}

function handleGameOver() {
  restartBtn.hidden = false;
  cancelAnimationFrame(requestAnimationId);
  gameOverModal.classList.add('show');
}

function onRestart() {
  window.removeEventListeners({ shouldRemoveAll: true });
  initGame();
  restartBtn.hidden = true;
  gameOverModal.classList.remove('show');
}
