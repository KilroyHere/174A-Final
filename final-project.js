import {
	defs,
	tiny
}
from './examples/common.js';
import { Text_Line } from "./examples/text-demo.js";
// Pull these names into this module's scope for convenience:
const {
	Vector,
	vec3,
	vec4,
	vec,
	hex_color,
	color,
	Mat4,
	Light,
	Shape,
	Material,
	Shader,
	Texture,
	Scene
} = tiny;
const {
	Triangle,
	Square,
	Tetrahedron,
	Windmill,
	Cube,
	Textured_Phong,
	Subdivision_Sphere
} = defs;
export class Shape_From_File extends Shape { // **Shape_From_File** is a versatile standalone Shape that imports
	// all its arrays' data from an .obj 3D model file.
	constructor(filename) {
		super("position", "normal", "texture_coord");
		// Begin downloading the mesh. Once that completes, return
		// control to our parse_into_mesh function.
		this.load_file(filename);
	}
	load_file(filename) { // Request the external file and wait for it to load.
		// Failure mode:  Loads an empty shape.
		return fetch(filename).then(response => {
			if(response.ok) return Promise.resolve(response.text())
			else return Promise.reject(response.status)
		}).then(obj_file_contents => this.parse_into_mesh(obj_file_contents)).catch(error => {
			this.copy_onto_graphics_card(this.gl);
		})
	}
	parse_into_mesh(data) { // Adapted from the "webgl-obj-loader.js" library found online:
		var verts = [],
			vertNormals = [],
			textures = [],
			unpacked = {};
		unpacked.verts = [];
		unpacked.norms = [];
		unpacked.textures = [];
		unpacked.hashindices = {};
		unpacked.indices = [];
		unpacked.index = 0;
		var lines = data.split('\n');
		var VERTEX_RE = /^v\s/;
		var NORMAL_RE = /^vn\s/;
		var TEXTURE_RE = /^vt\s/;
		var FACE_RE = /^f\s/;
		var WHITESPACE_RE = /\s+/;
		for(var i = 0; i < lines.length; i++) {
			var line = lines[i].trim();
			var elements = line.split(WHITESPACE_RE);
			elements.shift();
			if(VERTEX_RE.test(line)) verts.push.apply(verts, elements);
			else if(NORMAL_RE.test(line)) vertNormals.push.apply(vertNormals, elements);
			else if(TEXTURE_RE.test(line)) textures.push.apply(textures, elements);
			else if(FACE_RE.test(line)) {
				var quad = false;
				for(var j = 0, eleLen = elements.length; j < eleLen; j++) {
					if(j === 3 && !quad) {
						j = 2;
						quad = true;
					}
					if(elements[j] in unpacked.hashindices) unpacked.indices.push(unpacked.hashindices[elements[j]]);
					else {
						var vertex = elements[j].split('/');
						unpacked.verts.push(+verts[(vertex[0] - 1) * 3 + 0]);
						unpacked.verts.push(+verts[(vertex[0] - 1) * 3 + 1]);
						unpacked.verts.push(+verts[(vertex[0] - 1) * 3 + 2]);
						if(textures.length) {
							unpacked.textures.push(+textures[((vertex[1] - 1) || vertex[0]) * 2 + 0]);
							unpacked.textures.push(+textures[((vertex[1] - 1) || vertex[0]) * 2 + 1]);
						}
						unpacked.norms.push(+vertNormals[((vertex[2] - 1) || vertex[0]) * 3 + 0]);
						unpacked.norms.push(+vertNormals[((vertex[2] - 1) || vertex[0]) * 3 + 1]);
						unpacked.norms.push(+vertNormals[((vertex[2] - 1) || vertex[0]) * 3 + 2]);
						unpacked.hashindices[elements[j]] = unpacked.index;
						unpacked.indices.push(unpacked.index);
						unpacked.index += 1;
					}
					if(j === 3 && quad) unpacked.indices.push(unpacked.hashindices[elements[0]]);
				}
			}
		} {
			const {
				verts,
				norms,
				textures
			} = unpacked;
			for(var j = 0; j < verts.length / 3; j++) {
				this.arrays.position.push(vec3(verts[3 * j], verts[3 * j + 1], verts[3 * j + 2]));
				this.arrays.normal.push(vec3(norms[3 * j], norms[3 * j + 1], norms[3 * j + 2]));
				this.arrays.texture_coord.push(vec(textures[2 * j], textures[2 * j + 1]));
			}
			this.indices = unpacked.indices;
		}
		this.normalize_positions(false);
		this.ready = true;
	}
	draw(context, program_state, model_transform, material) { // draw(): Same as always for shapes, but cancel all
		// attempts to draw the shape before it loads:
		if(this.ready) super.draw(context, program_state, model_transform, material);
	}
}

class Collision_Sphere {
	constructor(starting_x, starting_y) {
		this.x_pos = starting_x;
		this.y_pos = starting_y;
		this.model_transform = Mat4.identity().times(Mat4.translation(this.x_pos, this.y_pos, 0)).times(Mat4.scale(0.5, 0.5, 0.5));
		this.t = 0;
		this.time = 1;
		this.color = color(1, 0, 0, 1);
	}

	update_time() {
		this.t = this.time + 0.0016;
		this.time = this.t;
	}
    
    update_state() {
		this.update_time();
	    let desired = this.model_transform.times(Mat4.scale(2, 2, 0));
		this.model_transform = desired.map((x, i) => Vector.from(this.model_transform[i]).mix(x, 0.05));
		this.x_pos = this.model_transform[0][3];
		this.y_pos = this.model_transform[1][3];
		//fire color 0.735, 0.2529, 0.0975
		this.color = color(1, 0, 0, 1 - (this.t - 1) * 20);
		if(this.t > 1.05)
		{
			return 1;
		}

		return 0;
	}

    get_model_transform() {
		return this.model_transform;
	}

	get_color() {
		return this.color;
	}

}

class Coin {
	constructor(starting_x, starting_y, x_vel, y_vel, color) {
		this.x_pos = starting_x;
		this.y_pos = starting_y;
		this.x_vel = x_vel;
		this.y_vel = y_vel;
		this.model_transform = Mat4.identity().times(Mat4.translation(this.x_pos, this.y_pos, 0)).times(Mat4.scale(0.2, 0.2, 0.002));
		this.has_disappeared = 0;
		this.t = 0;
		this.time = 1;
		this.radius = 0.2;
		this.color = color;
	}

	update_time() {
		this.t = this.time + 0.0016;
		this.time = this.t;
	}

	update_state() {
		this.update_time();
		if(this.y_pos < 0.2)
		{
		  this.x_vel = 0;
		  this.y_vel = 0;	
		  this.model_transform[1][3] = 0.2;
		}
		this.check_for_boundary_collision();
	    let desired = this.model_transform.times(Mat4.translation(this.x_vel, this.y_vel, 0));
		this.model_transform = desired.map((x, i) => Vector.from(this.model_transform[i]).mix(x, 0.05));
		this.x_pos = this.model_transform[0][3];
		this.y_pos = this.model_transform[1][3];
		if(this.t > 1.4)
		{
			this.has_disappeared = 1;
		}

		if(this.has_disappeared)
		  return 1;

		return 0;
	}
    
    check_if_collected(cannon_x_pos, radius) {
		if(this.y_pos <= 0.25 && (((this.x_pos + this.radius < cannon_x_pos + radius) && (this.x_pos + this.radius > cannon_x_pos - radius)) || ((this.x_pos - this.radius > cannon_x_pos - radius) && (this.x_pos - this.radius < cannon_x_pos + radius)))) 
		{
			this.has_disappeared = 1;
			return 1;
		}
		return 0;
	}

	check_for_boundary_collision() {
		if(this.model_transform[0][3] < -5.8 || this.model_transform[0][3] > 5.8) {
			if(this.model_transform[0][3] > (5.8)) this.model_transform[0][3] = (5.8);
			if(this.model_transform[0][3] < (-5.8)) this.model_transform[0][3] = (-5.8);
			this.x_vel = -1 * this.x_vel;
		}
	}

	get_x_pos() {
		return this.x_pos;
	}

	get_y_pos() {
		return this.y_pos;
	}

	get_model_transform() {
		return this.model_transform;
	}

	set_disappeared() {
		this.has_disappeared = 1;
	}

	get_disappeared() {
		return this.has_disappeared;
	}

	get_color() {
		return this.color;
	}
}
class Bullet {
	constructor(starting_x, y_vel) {
		this.x_pos = starting_x;
		this.y_pos = 14; //To be calculated
		this.y_vel = y_vel;
		//x_vel is always 0
		this.is_dead = 0;
		this.scale = 0.3;
		this.model_transform = Mat4.identity().times(Mat4.scale(this.scale, this.scale - 0.1, this.scale)).times(Mat4.translation(this.x_pos, this.y_pos, 0));
	}
	update_state() {
		let desired = this.model_transform.times(Mat4.translation(0, this.y_vel, 0));
		this.model_transform = desired.map((x, i) => Vector.from(this.model_transform[i]).mix(x, 0.05));
		this.x_pos = this.model_transform[0][3];
		this.y_pos = this.model_transform[1][3];
		//set dead if out of frame 
		if(this.y_pos > 18) this.set_dead();
		if(this.is_dead == 1) return 1;
		return 0;
	}
	get_x_pos() {
		return this.x_pos;
	}
	get_y_pos() {
		return this.y_pos;
	}
	set_dead() {
		this.is_dead = 1;
	}
	get_dead() {
		return this.is_dead;
	}
	get_model_transform() {
		return this.model_transform;
	}
}
class Rock {
	constructor(starting_x, starting_y, scale, x_vel, y_init, ) {
		this.model_transform = Mat4.identity().times(Mat4.scale(scale, scale, scale)).times(Mat4.translation(starting_x, starting_y, 0));
		this.scale = scale;
		this.color = color(Math.random() * 1.3, Math.random() * 1.2, Math.random() * 1.2, 1);
		this.x_pos = starting_x;
		this.y_pos = starting_y;
		this.x_vel = x_vel;
		this.y_vel = 0; //v_y
		this.y_init = y_init; //u_y
		this.y_translation = 0;
		this.t = 0;
		this.time = 1;
		this.g = -0.2;
		this.radius = scale * 1;
		this.is_dead = 0;
		this.breaking_factor = 1;
	}
	update_time() {
		this.t = this.time + 0.002;
		this.time = this.t;
	}
	update_state() {
		if(this.is_dead == 1) //If it is dead, either produces children or dies alone
		{
			if(this.scale >= this.breaking_factor) //Produces Children if size was greater than 1, else poof, buh-bye!
				return 2;
			else return 1;
		}
		this.update_time();
		this.y_vel = this.y_init + this.g * (this.t / 100);
		let collison = this.check_for_boundary_collision();
		this.y_translation = this.y_init * ((this.t)) + 0.5 * this.g * ((this.t)) * ((this.t));
		let desired = this.model_transform.times(Mat4.translation(this.x_vel, this.y_translation, 0));
		this.model_transform = desired.map((x, i) => Vector.from(this.model_transform[i]).mix(x, 0.5));
		this.x_pos = this.model_transform[0][3];
		this.y_pos = this.model_transform[1][3];
		if(collison == true)
		    return -1;
		return 0;
	}
	check_for_boundary_collision() {
		let correction_factor = this.scale;
		if(this.model_transform[1][3] > (18 + correction_factor) || this.model_transform[1][3] < (correction_factor)) {
			if(this.model_transform[1][3] > 18 + correction_factor) this.model_transform[1][3] = 18 + correction_factor;
			if(this.model_transform[1][3] < correction_factor) this.model_transform[1][3] = correction_factor;
			this.y_init = -1 * this.y_vel;
			this.time = 1;
			return true;
		}
		if(this.model_transform[0][3] < (-7 + correction_factor) || this.model_transform[0][3] > (7 - correction_factor)) {
			if(this.model_transform[0][3] > (7 - correction_factor)) this.model_transform[0][3] = (7 - correction_factor);
			if(this.model_transform[0][3] < (-7 + correction_factor)) this.model_transform[0][3] = (-7 + correction_factor);
			this.x_vel += Math.random() / 20;
			this.x_vel = -1 * this.x_vel;
			return true;
		}
	}
	set_dead() {
			this.is_dead = 1;
		}
		// return 1 on collison
		// return 0 if no collison
	check_for_bullet_collision(bullet_x_pos, bullet_y_pos) {
		if(bullet_x_pos < this.x_pos + this.radius && bullet_x_pos > this.x_pos - this.radius && bullet_y_pos < this.y_pos + this.radius && bullet_y_pos > this.y_pos - this.radius) {
			this.set_dead();
			return 1;
		} else return 0;
	}
	check_for_cannon_collision(cannon_x_pos, radius, height) {
		if((height > this.y_pos - this.radius) && (((this.x_pos + this.radius < cannon_x_pos + radius) && (this.x_pos + this.radius > cannon_x_pos - radius)) || ((this.x_pos - this.radius > cannon_x_pos - radius) && (this.x_pos - this.radius < cannon_x_pos + radius)))) 
		{
			return 1;
		}
		return 0;
	}
	get_model_transform() {
		return this.model_transform;
	}
	get_color() {
		return this.color;
	}
	get_x_pos() {
		return this.x_pos;
	}
	get_y_pos() {
		return this.y_pos;
	}
}


export class final_project extends Scene {
	constructor() {
		super();
		// Load the model file:
		this.shapes = {
			'box': new Cube(),
			'ball': new Subdivision_Sphere(4),
			'rock': new (Subdivision_Sphere.prototype.make_flat_shaded_version() ) (2),
			"vase": new Shape_From_File("assets/vase.obj"),
			"wheel": new Shape_From_File("assets/wheel.obj"),
			"grass": new Shape_From_File("assets/grass.obj"),
			"bullet": new Shape_From_File("assets/bullet.obj"),
			"coin": new Subdivision_Sphere(5),
			'text_long': new Text_Line(55),
		};
		this.plastic = new Material(new defs.Phong_Shader(), {
			ambient: .3,
			diffusivity: .8,
			specularity: .5,
			color: color(0.54, 0.27, 0.074, 1)
		});

        this.text = {
        	white: new Material(new Textured_Phong(), {
                ambient: 1, diffusivity: 0, specularity: 0, texture: new Texture("assets/text.png")}),
            white2: new Material(new Textured_Phong(), {
                ambient: 1, diffusivity: 0, specularity: 0, texture: new Texture("assets/text2-white.png")}),
            black: new Material(new Textured_Phong(), {
                ambient: 1, diffusivity: 0, specularity: 0, texture: new Texture("assets/text-black.png")}),
            blue: new Material(new Textured_Phong(), {
                ambient: 1, diffusivity: 0, specularity: 0, texture: new Texture("assets/text-blue.png")}),
            red: new Material(new Textured_Phong(), {
                ambient: 1, diffusivity: 0, specularity: 0, texture: new Texture("assets/text-red.png")}),
        }

        this.bumps = new Material(new defs.Fake_Bump_Map(1), {
            color: color(.5, .5, .5, 1),
            ambient: .3, diffusivity: .5, specularity: .5, texture: new Texture("assets/pic.jpg")
        });

           this.sky = new Material(new Textured_Phong(), {
            color: color(.5, .5, .5, 1),
            ambient: 0.6, diffusivity: .5, specularity: .5, texture: new Texture("assets/sky.jpg")
        });

         for (let i=0;i<this.shapes.box.arrays.texture_coord.length;i++){
            this.shapes.box.arrays.texture_coord[i][0] *= 1;
            this.shapes.box.arrays.texture_coord[i][1] *= 2;
        }

        this.rock_texture = new Material(new defs.Phong_Shader(),
            { specularity: 0.0, diffusivity: 1.0, color: hex_color("#bababa")});

		this.high_score = 0;
		this.initialize_new_game(1);
		this.boing = new Audio("boing.mp3")
		this.explosion = new Audio("explosion.mp3")
        this.coin_tune = new Audio("coins.mp3")
		this.theme = new Audio("theme.mp3")
		this.gun = new Audio("gun.mp3")
		this.gameover = new Audio("gameover.mp3")
		this.theme.loop = true;
		this.theme.volume = 0.3;
		this.playing = false;

	}
	initialize_new_game(state) {
		//Initial Position
		this.cannon_transform = Mat4.identity().times(Mat4.rotation(0, 1, 0, 0).times(Mat4.translation(0, +1.5, 0)));
		this.wheel_1 = Mat4.identity().times(Mat4.scale(0.5, 0.5, 0.5)).times(Mat4.translation(0, 1.5, 2));
		this.wheel_2 = this.wheel_1.times(Mat4.translation(0, 0, -4));
		this.wheel_rotation = 0;
		//Rocks
		this.rocks = []
		this.create_rock(); 
		this.create_rock();
		this.left = false;
		this.right = false;
		//Score Settings
		if(this.score > this.high_score) this.high_score = Math.floor(this.score);
		this.score = 0;
		//Bullet
		this.bullets = []
		this.is_game_over = state;

		//Coin
		this.coins = []

		// col-sphere
		this.col_spheres = []

	}



	make_control_panel() {
		// make_control_panel(): Sets up a panel of interactive HTML elements, including
		// buttons with key bindings for affecting this scene, and live info readouts.
		// The next line adds a live text readout of a data member of our Scene.
		this.live_string(box => {
			box.textContent = "Your Score : " + (Math.floor(this.score)) ;
		});
		this.new_line();
		this.live_string(box => {
			box.textContent =  "Your High Score : " + (this.high_score) ;
		});
		// Add buttons so the user can actively toggle data members of our Scene:
		this.new_line();
		this.key_triggered_button("Start Game", ["g"], function() {
		if(this.playing == false){
			this.theme.play();
			this.playing = true;
		}
			if(this.is_game_over == 1)
			    this.is_game_over = 2;
		});
		this.key_triggered_button("Move Left", ["a"], function() {
			if(this.right) this.right = !this.right;
			this.left = !this.left;
		});
		this.key_triggered_button("Move Right", ["d"], function() {
			if(this.left) this.left = !this.left;
			this.right = !this.right;
		});
		this.new_line();
		this.key_triggered_button("Shoot", [";"], function() {
			if(this.is_game_over == 0)
    			this.shoot_bullet();
		});
		this.new_line();
		this.key_triggered_button("Stop", ["s"], function() {
			if(this.right) this.right = !this.right;
			if(this.left) this.left = !this.left;
		});
		this.key_triggered_button("Add a rock", ["9"], function() {
			this.create_rock();
		});
		this.new_line();
		this.key_triggered_button("Mute Theme Song", ["b"], function() {
			if(this.theme.volume != 0)
			    this.theme.volume = 0;
			else
			    this.theme.volume = 0.3;
		});
	}
	move_left() {
		if(this.cannon_transform[0][3] > -6) {

			let desired = this.cannon_transform.times(Mat4.translation(-1.5, 0, 0));
			this.cannon_transform = desired.map((x, i) => Vector.from(this.cannon_transform[i]).mix(x, 0.1));
			let x = this.cannon_transform[0][3];
		    this.wheel_1 = Mat4.identity().times(Mat4.translation(x, 0.75, 1)).times(Mat4.scale(0.5, 0.5, 0.5)).times(Mat4.rotation(- x / 1.5, 0, 0, 1));
			this.wheel_2 = Mat4.identity().times(Mat4.translation(x, 0.75, -1)).times(Mat4.scale(0.5, 0.5, 0.5)).times(Mat4.rotation(- x / 1.5, 0, 0, 1));
		} else this.left = !this.left;
	}
	move_right() {
		if(this.cannon_transform[0][3] < 6) {
			let desired = this.cannon_transform.times(Mat4.translation(1.5, 0, 0));
			this.cannon_transform = desired.map((x, i) => Vector.from(this.cannon_transform[i]).mix(x, 0.1));
			let x = this.cannon_transform[0][3];
		    this.wheel_1 = Mat4.identity().times(Mat4.translation(x, 0.75, 1)).times(Mat4.scale(0.5, 0.5, 0.5)).times(Mat4.rotation(- x / 1.5, 0, 0, 1));
			this.wheel_2 = Mat4.identity().times(Mat4.translation(x, 0.75, -1)).times(Mat4.scale(0.5, 0.5, 0.5)).times(Mat4.rotation(- x / 1.5, 0, 0, 1));
		} else this.right = !this.right;
	}
	shoot_bullet() {
		let array_size = this.bullets.length;
		if(array_size == 0 || this.bullets[array_size - 1].y_pos > 4) //Scaled
		{
			let offset = 0;
			if(this.left) offset = -0.1;
			if(this.right) offset = 0.1;
			this.bullets.push(new Bullet((this.cannon_transform[0][3] + offset) / 0.3, 25));
			this.gun.play();
		}
	}

	create_rock() {
		let x_vel = [-0.1,0.1];
		this.rocks.push(new Rock(Math.floor(Math.random() * 10) - 5, 14, (Math.random() / 1.2) + 0.8, x_vel[Math.floor(Math.random()+0.5)], -0.3));
	}

	create_coin(x_pos, y_pos, color) {
        this.coins.push(new Coin(x_pos, y_pos, Math.random()*10 - 5, -10, color));
	}

	create_col_sphere(x_pos, y_pos) {
        this.col_spheres.push(new Collision_Sphere(x_pos, y_pos));
	}
	update_and_draw_bullets(context, program_state) {
		for(let j = 0; j < this.bullets.length; j++) {
			var ret = this.bullets[j].update_state();
			if(ret > 0) {
				this.bullets.splice(j, 1); //Splicing the Dead Bullet from the Array 
				j -= 1;
			} else {
				this.shapes.bullet.draw(context, program_state, this.bullets[j].get_model_transform(), this.plastic.override(color(1, 1, 1, 1)));
			}
		}
	}
	update_and_draw_rocks(context, program_state, mode) {
		for(let i = 0; i < this.rocks.length; i++) {
			if(!mode && this.rocks[i].check_for_cannon_collision(this.cannon_transform[0][3], 0.7, 2) == 1) // The boulder hit you on your head!!!! Sry Game Over
			{
				this.is_game_over = 1;
				this.gameover.play();
			}
			for(let k = 0; k < this.bullets.length; k++) //Goes through each bullet looking for collision
			{
				var r = this.rocks[i].check_for_bullet_collision(this.bullets[k].get_x_pos(), this.bullets[k].get_y_pos());
				if(r == 1) this.bullets[k].set_dead(); //Kills a bullet on Collision (Bullet is dead on collisoin)
			}
			var ret = this.rocks[i].update_state();

			if(ret > 0) //Error Code for a live rock, need to remove it from the Array.
			{
				if(ret == 2) //Produce offspring for this Error Code (See: Rock.update_state())
				{
					this.rocks.push(new Rock(this.rocks[i].get_x_pos(), this.rocks[i].get_y_pos(), this.rocks[i].scale / 2 + 0.3, -0.1, 0.4));
					this.rocks.push(new Rock(this.rocks[i].get_x_pos(), this.rocks[i].get_y_pos(), this.rocks[i].scale / 2 + 0.2, 0.1, 0.5));
					var coin_color;
					if(this.rocks[i].scale > 1.2)
					{
						coin_color = color(1, 0, 0, 1);
					}

					else
					{
						coin_color = color(0, 0, 1, 1);
					}
                    this.create_col_sphere(this.rocks[i].get_x_pos(), this.rocks[i].get_y_pos());
					this.create_coin(this.rocks[i].get_x_pos(), this.rocks[i].get_y_pos(), coin_color);
					this.explosion.play();
				}

				else
				{
					this.boing.play(); ///NEED A BETTER SOUND36
					this.create_coin(this.rocks[i].get_x_pos(), this.rocks[i].get_y_pos(), color(1, 1, 0, 1));
				}
				this.rocks.splice(i, 1); //Poof, buh-bye!
				i -= 1; //Index adjustment after deleting an element (Rock from Array)
			} 
			else {
				if(ret == -1){}
				    //PLAY COLLISION SOUND //Collision here takes place with the walls. !!!!NEED A SOUND!!!
				this.shapes.rock.draw(context, program_state, this.rocks[i].get_model_transform(), this.rock_texture.override(this.rocks[i].get_color())); //DRAWING happens here
			}
		}
		while(this.rocks.length < 1) {
			this.create_rock();
		}
	}

	update_and_draw_coins(context, program_state)
	{
        for(let i = 0; i < this.coins.length; i++) {
            if(this.coins[i].check_if_collected(this.cannon_transform[0][3], 0.7) == 1)
            {
            	if(this.coins[i].get_color().equals([1, 0, 0, 1]))
            	{
            		this.score += 25;
            	}

            	else if(this.coins[i].get_color().equals([0, 0, 1, 1]))
            	{
            		this.score += 15;
            	}

            	if(this.coins[i].get_color().equals([1, 1, 0, 1]))
            	{
            		this.score += 10;
            	}
                this.coin_tune.play();
                this.coins[i].set_disappeared();
            }
            var ret = this.coins[i].update_state();
            if(ret == 1)
            {
            	this.coins.splice(i, 1); 
				i -= 1; //Index adjustment after deleting an element (Rock from Array)
            }

            else
            {
            	this.shapes.coin.draw(context, program_state, this.coins[i].get_model_transform(), this.plastic.override(this.coins[i].get_color())); //DRAWING happens here
            }
        }
	}

	update_and_draw_col_spheres(context, program_state)
	{
		for(let i = 0; i < this.col_spheres.length; i++) {
            var ret = this.col_spheres[i].update_state();
            if(ret == 1)
            {
            	this.col_spheres.splice(i, 1); 
				i -= 1; //Index adjustment after deleting an element (Rock from Array)
            }

            else
            {
            	this.shapes.ball.draw(context, program_state, this.col_spheres[i].get_model_transform(), this.plastic.override(this.col_spheres[i].get_color()));
            }
        }

	}

	populate_grass(context, program_state) {
		// array of box model transforms
		var j = -9;
		while(j < 3) {
			this.populate_grass_horizontal(context, program_state, j);
			j++;
		}
	}
	populate_grass_horizontal(context, program_state, i) {
		// array of box model transforms
		let grass_transform = Mat4.identity().times(Mat4.translation(-13, -0.2, i * 3)).times(Mat4.rotation(-Math.PI/2,1,0,0)).times(Mat4.scale(2,2,10));
		var j = 0;
		while(j < 7) {
			this.shapes.grass.draw(context, program_state, grass_transform, this.rock_texture.override(color(0,1,0,1)));
			grass_transform = grass_transform.times(Mat4.translation(2.15, 0, 0));
			j++;
		}
	}
	set_scene(context, program_state) {
		if(!context.scratchpad.controls) {
			this.children.push(context.scratchpad.controls = new defs.Movement_Controls());
			let model_transform = Mat4.identity().times(Mat4.translation(0, -7, -20)).times(Mat4.rotation(-Math.PI / 20, 1, 0, 0));
			//.times(Mat4.rotation(-Math.PI/15,1,0,0)) 
			program_state.set_camera(model_transform);
		}
		program_state.projection_transform = Mat4.perspective(Math.PI / 4, context.width / context.height, 1, 100);
		const light_position = vec4(10, 10, 10, 1);
		program_state.lights = [new Light(light_position, color(1, 1, 1, 1), 1000)];
		const light_position2 = vec4(this.cannon_transform[0][3], this.cannon_transform[1][3], 0, 1);
		program_state.lights.push(new Light(light_position2, color(0, 1, 0, 1), 10));
		let ground_transform = Mat4.identity().times(Mat4.scale(60, 0.001, 60));
		this.shapes.box.draw(context, program_state, ground_transform, this.plastic.override(color(0, 1, 0, 1)));
		let sky_transform = Mat4.identity().times(Mat4.translation(0, 0, -30)).times(Mat4.scale(30, 40, 0.001));
		this.shapes.box.draw(context, program_state, sky_transform, this.sky);
 		this.populate_grass(context, program_state);
	}

	draw_text_static(color_id,context,program_state, string_to_print,scale,x_pos,y_pos){
		let text_color = [this.text.white,this.text.white2,this.text.black,this.text.blue,this.text.red];
        let start_screen_transform = Mat4.identity()
        .times(Mat4.translation(x_pos, y_pos, 5))
        .times(Mat4.scale(scale, scale, scale));
         this.shapes.text_long.set_string(string_to_print, context.context);
         this.shapes.text_long.draw(context,program_state,start_screen_transform,text_color[color_id]);
	}

	draw_mainscreen_text(context,program_state){
        this.draw_text_static(1, context,program_state, "Welcome to Rock Blast!",0.3,-4.5, 12);
        this.draw_text_static(1, context,program_state, "Ball Blast is an arcade game where",0.2,-5, 11);
        this.draw_text_static(1, context,program_state, " where you have to use a cannon ",0.2,-5, 10.5);
        this.draw_text_static(1, context,program_state, "  to shoot bombs at giant rocks to  ",0.2,-5, 10);
        this.draw_text_static(1, context,program_state, "  smash them to smithereens,or in ",0.2,-5, 9.5);
        this.draw_text_static(1, context,program_state, "          this case,coins.",0.2,-5, 9);

       // Fun, frantic and full of fast paced action, Ball Blast tasks you with destroying the slowly advancing blocks and circles before they reach your shooter
	}


    draw_score(context,program_state,string ,x,y,z)
    {
    	let score_transform = Mat4.identity().times(Mat4.translation(x,y,z));
    	let score = this.score;
    	this.shapes.text_long.set_string(string, context.context);
    	this.shapes.text_long.draw(context,program_state,score_transform,this.text.white2);
    }
	display(context, program_state) {
		//0.016 ------BETTER GRAVITY ;
		if(this.is_game_over == 0) {
			this.mode = 0;
			if(this.right) this.move_right();
			if(this.left) this.move_left();
			this.score += 0.06;
			this.set_scene(context, program_state);
			this.shapes.vase.draw(context, program_state, this.cannon_transform, this.bumps);
			this.shapes.wheel.draw(context, program_state, this.wheel_1, this.plastic);
			this.shapes.wheel.draw(context, program_state, this.wheel_2, this.plastic);
			this.update_and_draw_bullets(context, program_state);
			this.draw_score(context,program_state,"Score: " + Math.floor(this.score),2,32,-29);
			this.update_and_draw_rocks(context, program_state, this.mode);
			this.update_and_draw_coins(context, program_state);
			this.update_and_draw_col_spheres(context, program_state);
		
		} 
		else if(this.is_game_over == 1) {    //This is the state of the game initially as well as when it is over.
		    this.bullets = [];
		    this.mode = 1;
			this.set_scene(context, program_state);
		    this.update_and_draw_rocks(context, program_state, this.mode);
            this.draw_mainscreen_text(context,program_state);
            this.draw_score(context,program_state,"Your Score:" + Math.floor(this.score),-9,15,-25);
            this.draw_score(context,program_state,"Your HighScore:" + Math.floor(this.high_score),-11,12,-25);
//             if(this.score > this.high_score)
//                  this.draw_score(context,program_state,"Personal Best!!!",-11,9,-20);
        
		} 
		else if(this.is_game_over == 2){ //RESTART
			this.initialize_new_game(0);
		}
	}
}


class Gouraud_Shader extends Shader {
    // This is a Shader using Phong_Shader as template
    // TODO: Modify the glsl coder here to create a Gouraud Shader (Planet 2)

    constructor(num_lights = 2) {
        super();
        this.num_lights = num_lights;
    }

    shared_glsl_code() {
        // ********* SHARED CODE, INCLUDED IN BOTH SHADERS *********
        return ` 
        precision mediump float;
        const int N_LIGHTS = ` + this.num_lights + `;
        uniform float ambient, diffusivity, specularity, smoothness;
        uniform vec4 light_positions_or_vectors[N_LIGHTS], light_colors[N_LIGHTS];
        uniform float light_attenuation_factors[N_LIGHTS];
        uniform vec4 shape_color;
        uniform vec3 squared_scale, camera_center;
        // Specifier "varying" means a variable's final value will be passed from the vertex shader
        // on to the next phase (fragment shader), then interpolated per-fragment, weighted by the
        // pixel fragment's proximity to each of the 3 vertices (barycentric interpolation).
        varying vec3 N, vertex_worldspace;
        
        // Gouraud Shader
        varying vec4 VERTEX_COLOR;
        
        // ***** PHONG SHADING HAPPENS HERE: *****                                       
        vec3 phong_model_lights( vec3 N, vec3 vertex_worldspace ){                                        
            // phong_model_lights():  Add up the lights' contributions.
            vec3 E = normalize( camera_center - vertex_worldspace );
            vec3 result = vec3( 0.0 );
            for(int i = 0; i < N_LIGHTS; i++){
                // Lights store homogeneous coords - either a position or vector.  If w is 0, the 
                // light will appear directional (uniform direction from all points), and we 
                // simply obtain a vector towards the light by directly using the stored value.
                // Otherwise if w is 1 it will appear as a point light -- compute the vector to 
                // the point light's location from the current surface point.  In either case, 
                // fade (attenuate) the light as the vector needed to reach it gets longer.  
                vec3 surface_to_light_vector = light_positions_or_vectors[i].xyz - 
                                               light_positions_or_vectors[i].w * vertex_worldspace;                                             
                float distance_to_light = length( surface_to_light_vector );
                vec3 L = normalize( surface_to_light_vector );
                vec3 H = normalize( L + E );
                // Compute the diffuse and specular components from the Phong
                // Reflection Model, using Blinn's "halfway vector" method:
                float diffuse  =      max( dot( N, L ), 0.0 );
                float specular = pow( max( dot( N, H ), 0.0 ), smoothness );
                float attenuation = 1.0 / (1.0 + light_attenuation_factors[i] * distance_to_light * distance_to_light );
                
                vec3 light_contribution = shape_color.xyz * light_colors[i].xyz * diffusivity * diffuse
                                                          + light_colors[i].xyz * specularity * specular;
                result += attenuation * light_contribution;
            }
            return result;
        }`;
    }

    vertex_glsl_code() {
        // ********* VERTEX SHADER *********
        return this.shared_glsl_code() + `
            attribute vec3 position, normal;                            
            // Position is expressed in object coordinates.
            
            uniform mat4 model_transform;
            uniform mat4 projection_camera_model_transform;
    
            void main(){                                                                   
                // The vertex's final resting place (in NDCS):
                gl_Position = projection_camera_model_transform * vec4( position, 1.0 );
                // The final normal vector in screen space.
                N = normalize( mat3( model_transform ) * normal / squared_scale);
                vertex_worldspace = ( model_transform * vec4( position, 1.0 ) ).xyz;
                
                // Gouraud Shader
                // vec4 color = vec4( shape_color.xyz * ambient, shape_color.w );
                color.xyz += phong_model_lights( normalize( N ), vertex_worldspace );
                VERTEX_COLOR = color; 
            } `;
    }

    fragment_glsl_code() {
        // ********* FRAGMENT SHADER *********
        // A fragment is a pixel that's overlapped by the current triangle.
        // Fragments affect the final image or get discarded due to depth.
        return this.shared_glsl_code() + `
            void main(){                                                           
                // Compute an initial (ambient) color:
                // gl_FragColor = vec4( shape_color.xyz * ambient, shape_color.w );
                // Compute the final color with contributions from lights:
                gl_FragColor = VERTEX_COLOR;
            } `;
    }

    send_material(gl, gpu, material) {
        // send_material(): Send the desired shape-wide material qualities to the
        // graphics card, where they will tweak the Phong lighting formula.
        gl.uniform4fv(gpu.shape_color, material.color);
        gl.uniform1f(gpu.ambient, material.ambient);
        gl.uniform1f(gpu.diffusivity, material.diffusivity);
        gl.uniform1f(gpu.specularity, material.specularity);
        gl.uniform1f(gpu.smoothness, material.smoothness);
    }

    send_gpu_state(gl, gpu, gpu_state, model_transform) {
        // send_gpu_state():  Send the state of our whole drawing context to the GPU.
        const O = vec4(0, 0, 0, 1), camera_center = gpu_state.camera_transform.times(O).to3();
        gl.uniform3fv(gpu.camera_center, camera_center);
        // Use the squared scale trick from "Eric's blog" instead of inverse transpose matrix:
        const squared_scale = model_transform.reduce(
            (acc, r) => {
                return acc.plus(vec4(...r).times_pairwise(r))
            }, vec4(0, 0, 0, 0)).to3();
        gl.uniform3fv(gpu.squared_scale, squared_scale);
        // Send the current matrices to the shader.  Go ahead and pre-compute
        // the products we'll need of the of the three special matrices and just
        // cache and send those.  They will be the same throughout this draw
        // call, and thus across each instance of the vertex shader.
        // Transpose them since the GPU expects matrices as column-major arrays.
        const PCM = gpu_state.projection_transform.times(gpu_state.camera_inverse).times(model_transform);
        gl.uniformMatrix4fv(gpu.model_transform, false, Matrix.flatten_2D_to_1D(model_transform.transposed()));
        gl.uniformMatrix4fv(gpu.projection_camera_model_transform, false, Matrix.flatten_2D_to_1D(PCM.transposed()));

        // Omitting lights will show only the material color, scaled by the ambient term:
        if (!gpu_state.lights.length)
            return;

        const light_positions_flattened = [], light_colors_flattened = [];
        for (let i = 0; i < 4 * gpu_state.lights.length; i++) {
            light_positions_flattened.push(gpu_state.lights[Math.floor(i / 4)].position[i % 4]);
            light_colors_flattened.push(gpu_state.lights[Math.floor(i / 4)].color[i % 4]);
        }
        gl.uniform4fv(gpu.light_positions_or_vectors, light_positions_flattened);
        gl.uniform4fv(gpu.light_colors, light_colors_flattened);
        gl.uniform1fv(gpu.light_attenuation_factors, gpu_state.lights.map(l => l.attenuation));
    }

    update_GPU(context, gpu_addresses, gpu_state, model_transform, material) {
        // update_GPU(): Define how to synchronize our JavaScript's variables to the GPU's.  This is where the shader
        // recieves ALL of its inputs.  Every value the GPU wants is divided into two categories:  Values that belong
        // to individual objects being drawn (which we call "Material") and values belonging to the whole scene or
        // program (which we call the "Program_State").  Send both a material and a program state to the shaders
        // within this function, one data field at a time, to fully initialize the shader for a draw.

        // Fill in any missing fields in the Material object with custom defaults for this shader:
        const defaults = {color: color(0, 0, 0, 1), ambient: 0, diffusivity: 1, specularity: 1, smoothness: 40};
        material = Object.assign({}, defaults, material);

        this.send_material(context, gpu_addresses, material);
        this.send_gpu_state(context, gpu_addresses, gpu_state, model_transform);
    }
}
