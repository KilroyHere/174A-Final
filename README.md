
# **Rock Blast**


**Team Members: Sanchit Agarwal (105389151) ; Aryan Patel (005329756)**

## **Summary**

A homage to the cult favorite Ball Blast. Rock Blast is an amazing cannon shooter game with the classic Space Invaders persona. In this game you control the cannon set upright pointing towards the array of falling rocks and boulders straight from the bowels of a mining quarry. Your cannon is customised to shoot rock-destroying missiles instead of the standard cannon balls. You can move your cannon in left or right directions to shoot at the falling rocks. The only catch here is that you can&#39;t catch the rocks using your cannon. If your cannon collides with any of the rocks or boulders, it&#39;s game over for you. However to compensate for this impishness we provide a chance to the player to collect coins to boost their scores. Depending on the size of the rock you destroy, you&#39;ll get coins of different values. Your score will be determined by the amount of time you survive this cataclysm and the coins you collect. ![](RackMultipart20210321-4-dv0tx6_html_5193f235123bcf33.png)

_Do you have what it takes to take on the bouncing geodudes? Play to find out!!!_

## ![](assets/pic1.png) ![](assets/pic2.png)

## **Advanced Topics**

- Collision Detection
  - We detect collisions between:
    - The bullets and the rocks
    - The rocks and the cannon
    - The walls and the rocks
    - The coins and the cannon
- Advanced Physics
  - We used several advanced Physics features:
    - Cartoon Gravity on rocks and coins
    - Proper projectile motion of coins
    - 2-D motion of rocks under gravity
    - Super elastic collisions between walls and rocks
    - Rock explosion
    - Object picking
- Bump Mapping
  - We have done bump mapping on cannon for a more realistic look

**Design**

- Object oriented Design with class structure for each game element

  - We have made a modular program with several classes holding identity defining information to ensure smooth interaction among various elements of the game. There is a class for rocks, bullets and coins. There is also a class that defines the explosion sphere that shows up when a rock explodes.
- Custom time ticking function for each clock
  - We have made a custom time function for each entity to ensure logical updation rate as per individual object needs so that the performance of the game is at the peak
- Blending for smooth movement
  - We have used blending in every kind of motion from cannon&#39;s linear motion to the projectile of coins to ensure a smooth non-lagging transition.
- Intuitive controls
  - We have designed a set of very intuitive controls to maximize user&#39;s playing experience

**Implementation**

- Collision
  - All entities are designed as classes with identities such as position, radius and height and thus collision is detected on the basis of object penetration
  - Super Elasticity between wall and rocks is created by coding some newtonian dynamics equations and increasing the rebound momentum by 20%.
- Explosion
  - Explosion is a by-product of bullet-rock collision. As soon as the bullet collides with a big enough rock, the rock disappears and a collision sphere is created with expands and fades proportionally with time
- Gravity
  - Each object is given a custom time function and according to its time various calculations are made on the lines of 2nd equation of motion to simulate gravity and the resulting motion due to it.

**Roles**

- Aryan Patel
  - Bump Mapping
  - Collision Detection
  - Textures
  - Advanced Physics
- Sanchit Agarwal
  - Collision Detection
  - OOP game logic
  - Sound Effects
  - Advanced Physics

## **Instructions**

To start the server: On Windows, run host.bat. On Mac/Linux, run host.command.

To play the game, navigate to localhost:8000 on your web browser (Google Chrome recommended).

### **Controls**

Press &#39;g&#39; to start the game. The &#39;a&#39; and &#39;d&#39; keys are used to move left and right.

The movement in this game is semi-automated, hence the cannon will keep on moving in the direction of the button pressed just once and can only be stopped if it is made to move in the opposite direction or made to stop using the &#39;s&#39; key.(This keeps the gameplay smooth, and prevents the user from long-pressing any buttons.)

The ; key shoots the missiles towards the air.

The theme song of the game can also be muted using the &#39;b&#39; key.

## **Credits**

Built upon the [tiny-graphics.js](https://github.com/encyclopedia-of-code/tiny-graphics-js) library for WebGL programs.
