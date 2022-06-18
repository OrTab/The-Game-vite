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
  TObjectsType,
} from './models';
import { getRandomInt, createImage, sleep, runPolyfill } from './utils';
import platform from './assets/platform.png';
import background from './assets/background.png';
import floor from './assets/floor.png';
import spriteRunRight from './assets/spriteRunRight.png';
import spriteRunLeft from './assets/spriteRunLeft.png';

const playerImgRight = createImage(spriteRunRight, shouldInitGame);
const playerImgLeft = createImage(spriteRunLeft, shouldInitGame);
const backgroundImage = createImage(background, shouldInitGame);
const floorImage = createImage(floor, shouldInitGame);
const platformImage = createImage(platform, shouldInitGame);

let numOfLoadedImages = 0;
let requestAnimationId = 0;

runPolyfill();
const canvas = document.querySelector('canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
document.querySelector('.game-over .btn')?.addEventListener('click', onRestart);

class Game {
  private velocityXDiff: number = Values.X_DIFF;
  private velocityYDiff: number = Values.Y_DIFF;
  readonly gravity: number = Values.Gravity;
  jumpsCounter: number = 0;
  player: IPlayer;
  velocity: Velocity = {
    x: 0,
    y: 10,
  };
  keys: PressedKeys = {
    right: { isPressed: false },
    left: { isPressed: false },
  };
  platforms: GenericObject[] = [];
  genericObjects: GenericObject[] = [];
  floors: GenericObject[] = [];
  numberOfFramesToIncreaseDistance = 0;
  lastDistanceToIncreaseSpeed = 0;
  distance = 0;
  numberOfFramesToMovePlayerImage = 0;
  platformMovementXDiff = 8;
  floorMovementXDiff = 8;

  constructor(player: IPlayer) {
    this.player = player;
    window.addEventListener('resize', this.resize.bind(this));
    this.resize();
    this.initObjects();
    this.animate();
  }

  get bothKeysPressed() {
    return this.keys.right.isPressed && this.keys.left.isPressed;
  }

  get isLeftOrRightPressed() {
    return this.keys.right.isPressed || this.keys.left.isPressed;
  }

  get canGoLeft() {
    return (
      this.keys.left.isPressed &&
      !this.bothKeysPressed &&
      this.player.position.x > 100
    );
  }

  get atPositionToIncreaseSpeed() {
    return this.player.position.x >= canvas.width / 1 / 2;
  }

  get canGoRight() {
    return (
      !this.bothKeysPressed &&
      this.keys.right.isPressed &&
      !this.atPositionToIncreaseSpeed
    );
  }

  get isOnFloor() {
    return this.floors.some(this.checkIsOnObject.bind(this));
  }

  get isOnPlatform() {
    return this.platforms.some(this.checkIsOnObject.bind(this));
  }

  initObjects() {
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
      img: floorImage,
      type: 'floor',
    });
  }

  //main function , control the flow
  animate() {
    requestAnimationId = requestAnimationFrame(this.animate.bind(this));
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    this.genericObjects.forEach((obj) => obj.draw());
    this.handleFloor();
    this.handlePlatforms();
    this.handleDistance();
    this.updateVelocity();
    this.updatePlayerPosition();
  }

  handleFloor() {
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

  shouldAddMoreFloors() {
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
            img: floorImage,
            type: 'floor',
          }) || [];
        this.floors.push(...floors);
      }
    }
  }

  updateVelocity() {
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

  updatePlayerPosition() {
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

  drawPlayer() {
    const {
      position: { x, y },
      size: { width, height },
      playerImage,
    } = this.player;

    if (this.bothKeysPressed || this.keys.right.isPressed) {
      playerImage.image = playerImgRight;
    } else if (this.keys.left.isPressed) playerImage.image = playerImgLeft;

    ctx.drawImage(
      playerImage.image || playerImgRight,
      playerImage.currPlayerImageFramePosition,
      0,
      Values.PlayerImageFrameWidth,
      Values.PlayerImageFrameHeight,
      x,
      y,
      height,
      width
    );
    if (this.isLeftOrRightPressed) {
      this.numberOfFramesToMovePlayerImage++;
      if (
        this.numberOfFramesToMovePlayerImage >
        Values.NumberOfFramesToMovePlayerImage
      ) {
        this.handlePlayerImage();
        this.numberOfFramesToMovePlayerImage = 0;
      }
    } else {
      playerImage.currPlayerImageFramePosition = 0;
    }
  }

  checkIsOnObject(object: GenericObject) {
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

  handlePlatforms() {
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

  shouldAddMorePlatforms() {
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

  getGameObjects({ minX, maxX = 500, img, type }: IObjectCreationParams) {
    const callbackPerType: {
      [type in TObjectsType]: () => GenericObject;
    } = {
      platform() {
        minX = getRandomInt(minX + Values.MinXDiffBetweenPlatform, maxX);
        maxX += 500;
        const platform = new GenericObject(
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
        return platform;
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

  async handleDistance() {
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
      await sleep(500);
      this.platformMovementXDiff += 0.1;
      await sleep(500);
      this.platformMovementXDiff += 0.2;
    }
  }

  handlePlayerImage() {
    const { playerImage } = this.player;
    playerImage.currPlayerImageFramePosition =
      playerImage.currPlayerImageFrame * Values.PlayerImageFrameWidth;
    playerImage.currPlayerImageFrame++;
    if (
      playerImage.currPlayerImageFrame === Values.NumberOfPlayerFramesInImage
    ) {
      playerImage.currPlayerImageFrame = 0;
    }
  }

  handleOnKey({ code, type }: KeyboardEvent) {
    let velocityY = this.velocityYDiff;
    switch (code) {
      case 'ArrowUp':
      case 'Space':
        if (this.jumpsCounter >= Values.MaxJumpsWhileInAir) return;
        if (type === 'keyup') {
          this.jumpsCounter++;
          // console.log(`You have more ${Values.maxJumpsWhileInAir - this.upCounter} times to jump while air`);
        } else {
          if (this.jumpsCounter > 0) {
            velocityY -= 5;
          }
          this.velocity.y = -velocityY;
        }
        break;
      case 'ArrowDown':
        break;
      case 'ArrowRight':
        if (type === 'keyup') {
          this.keys.right.isPressed = false;
        } else {
          this.keys.right.isPressed = true;
        }
        break;
      case 'ArrowLeft':
        if (type === 'keyup') {
          this.keys.left.isPressed = false;
        } else {
          this.keys.left.isPressed = true;
        }
        break;
    }
  }

  resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
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
  initialProperties.playerImage = {
    image: playerImgRight,
    currPlayerImageFrame: 0,
    currPlayerImageFramePosition: 0,
  };
  const player = new Game(initialProperties);
  window.addEventListener('keydown', player.handleOnKey.bind(player));
  window.addEventListener('keyup', player.handleOnKey.bind(player));
}

function handleGameOver() {
  cancelAnimationFrame(requestAnimationId);
  const elGameOverModal = document.querySelector('.game-over');
  elGameOverModal?.classList.add('show');
}

function onRestart() {
  window.removeEventListeners({ shouldRemoveAll: true });
  initGame();
  document.querySelector('.game-over')?.classList.remove('show');
}
