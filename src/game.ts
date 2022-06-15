import './styles/style.css';
import {
  Position,
  PressedKeys,
  Size,
  Values,
  Velocity,
  InitialPlayerProperties,
  IPlayer,
} from './models';
import { getRandomInt, createImage, sleep } from './utils';
import platformImage from './assets/platform.png';
import background from './assets/background.png';
import floor from './assets/floor.png';

const imgRight = createImage(
  'https://s3-us-west-2.amazonaws.com/s.cdpn.io/160783/boy1.png',
  initGame
);
const imgLeft = createImage(
  'https://s3-us-west-2.amazonaws.com/s.cdpn.io/160783/boy2.png',
  initGame
);
const backgroundImage = createImage(background, initGame);
const floorImage = createImage(floor, initGame);

let numOfLoadedImages = 0;
let numberOfFramesToIncreaseDistance = 0;
let lastDistanceToIncreaseSpeed = 0;
let distance = 0;
let numberOfFramesToMovePlayerImage = 0;
let platformMovementXDiff = 4;
let requestAnimationFrame = window.requestAnimationFrame;

const canvas = document.querySelector('canvas');
const c = canvas?.getContext('2d');

Array.prototype.at = function (idx) {
  if (idx < 0) return this[this.length + idx];
  return this[idx];
};

class Game {
  private velocityXDiff: number = Values.X_DIFF;
  private velocityYDiff: number = Values.Y_DIFF;
  readonly gravity: number = 1;
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
  platforms: Platform[] = [];
  genericObjects: GenericObject[] = [];
  floors: GenericObject[] = [];

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

  get canGoRight() {
    return (
      canvas &&
      !this.bothKeysPressed &&
      this.keys.right.isPressed &&
      this.player.position.x < canvas.width / 1.5
    );
  }

  get isOnFloor() {
    return canvas && this.floors.some(this.checkIsOnObject.bind(this));
  }

  get isOnPlatform() {
    return this.platforms.some(this.checkIsOnObject.bind(this));
  }

  initObjects() {
    if (canvas) {
      this.platforms = this.getPlatforms() || [];

      this.genericObjects[0] = new GenericObject(
        { x: -1, y: -1 },
        { height: canvas.height, width: canvas.width },
        backgroundImage
      );
      this.floors[0] = new GenericObject(
        { x: 0, y: canvas.height - 120 },
        { height: 120, width: canvas.width / 2 },
        floorImage
      );
      this.floors[1] = new GenericObject(
        { x: canvas.width / 2 + 200, y: canvas.height - 120 },
        { height: 120, width: canvas.width / 2 - 200 },
        floorImage
      );
    }
  }

  //main function , control the flow
  animate() {
    requestAnimationFrame(this.animate.bind(this));
    canvas && c && c.clearRect(0, 0, canvas.width, canvas.height);
    this.genericObjects.forEach((obj) => obj.draw());
    this.handleFloor();
    this.handlePlatforms();
    this.handleDistance();
    this.updateVelocity();
    this.updatePlayerPosition();
  }

  handleFloor() {
    this.floors.forEach((floor) => floor.draw());
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
    const { position } = this.player;
    position.y += this.velocity.y;
    position.x += this.velocity.x;
    this.drawPlayer();
  }

  drawPlayer() {
    const {
      position: { x, y },
      playerImage,
    } = this.player;

    if (c && canvas) {
      if (this.bothKeysPressed || this.keys.right.isPressed) {
        playerImage.image = imgRight;
      } else if (this.keys.left.isPressed) playerImage.image = imgLeft;

      c.drawImage(
        playerImage.image || imgRight,
        playerImage.currPlayerImageFramePosition,
        0,
        89,
        103,
        x,
        y,
        89,
        103
      );
    }
    if (this.isLeftOrRightPressed && !this.bothKeysPressed) {
      numberOfFramesToMovePlayerImage++;
      if (
        this.velocity.y === 0 &&
        numberOfFramesToMovePlayerImage > Values.NumberOfFramesToMovePlayerImage
      ) {
        this.handlePlayerImage();
        numberOfFramesToMovePlayerImage = 0;
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
      position.x + width >= object.position.x
    );
  }

  handlePlatforms() {
    canvas &&
      this.platforms.forEach((platform, idx) => {
        if (platform.position.x + canvas.width < this.player.position.x) {
          setTimeout(() => {
            this.platforms.splice(idx, 1);
          }, 0);
        }
        platform.position.x -= platformMovementXDiff;

        if (this.checkIsOnObject(platform)) {
          if (!this.keys.right.isPressed) {
            this.player.position.x -= platformMovementXDiff;
          }
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
        const { x: posX } = lastPlatform && lastPlatform.position;
        const platforms =
          this.getPlatforms(posX, posX + lastPlatform.size.width) || [];
        this.platforms.push(...platforms);
      }
    }
  }

  getPlatforms(minX = 100, maxX = 500) {
    const img = createImage(platformImage);
    return (
      canvas &&
      Array(5)
        .fill('')
        .map(() => {
          minX = getRandomInt(minX + Values.MinXDiffBetweenPlatform, maxX);
          maxX += 500;
          const platform = new Platform(
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
        })
    );
  }

  async handleDistance() {
    numberOfFramesToIncreaseDistance++;
    if (
      numberOfFramesToIncreaseDistance < Values.NumberOfFramesToIncreaseDistance
    ) {
      return;
    }
    distance++;
    numberOfFramesToIncreaseDistance = 0;
    if (
      distance - Values.RangeToIncreaseSpeed ===
      lastDistanceToIncreaseSpeed
    ) {
      lastDistanceToIncreaseSpeed = distance;
      platformMovementXDiff += 0.2;
      await sleep(500);
      platformMovementXDiff += 0.1;
      await sleep(500);
      platformMovementXDiff += 0.2;
    }
  }

  handlePlayerImage() {
    const { playerImage } = this.player;
    playerImage.currPlayerImageFramePosition =
      playerImage.currPlayerImageFrame * 89;
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
    if (canvas) {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
  }
}

class GenericObject {
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
    if (c) {
      c.drawImage(img, x, y, width, height);
    }
  }
}

class Platform extends GenericObject {
  constructor(position: Position, size: Size, image: HTMLImageElement) {
    super(position, size, image);
  }
}

function initGame() {
  numOfLoadedImages++;
  if (numOfLoadedImages === Values.NumberOfImages) {
    InitialPlayerProperties.playerImage = {
      image: imgRight,
      currPlayerImageFrame: 0,
      currPlayerImageFramePosition: 0,
    };
    const player = new Game(InitialPlayerProperties);
    window.addEventListener('keydown', player.handleOnKey.bind(player));
    window.addEventListener('keyup', player.handleOnKey.bind(player));
  }
}
