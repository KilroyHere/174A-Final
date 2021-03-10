import {
	defs,
	tiny
}
from './common.js';
import { Text_Line } from "./text-demo.js";
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
	Subdivision_Sphere,
	Textured_Phong
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
		return this.is_dead();
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
		this.t = this.time + 0.0016;
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
		let correction_factor = 1 - this.scale;
		if(this.model_transform[1][3] > (18 + correction_factor) || this.model_transform[1][3] < (1 + correction_factor)) {
			if(this.model_transform[1][3] > 18 + correction_factor) this.model_transform[1][3] = 18 + correction_factor;
			if(this.model_transform[1][3] < 1 + correction_factor) this.model_transform[1][3] = 1 + correction_factor;
			this.y_init = -1 * this.y_vel;
			this.time = 1;
			return true;
		}
		if(this.model_transform[0][3] < (-6 + correction_factor) || this.model_transform[0][3] > (6 + correction_factor)) {
			if(this.model_transform[0][3] > (6 + correction_factor)) this.model_transform[0][3] = (6 + correction_factor);
			if(this.model_transform[0][3] < (-6 + correction_factor)) this.model_transform[0][3] = (-6 + correction_factor);
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
export class Obj_File_Demo extends Scene {
	constructor() {
		super();
		// Load the model file:
		this.shapes = {
			'box': new Cube(),
			'ball': new Subdivision_Sphere(4),
			'rock': new Subdivision_Sphere(3),
			"vase": new Shape_From_File("assets/vase.obj"),
			"wheel": new Shape_From_File("assets/wheel.obj"),
			"grass": new Shape_From_File("assets/grass.obj"),
			"bullet": new Shape_From_File("assets/bullet.obj"),
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

		this.high_score = 0;
		this.initialize_new_game(1);
		this.boing = new Audio("boing.mp3")
		this.boing.loop = false

		this.theme = new Audio("theme.mp3")
		this.theme.loop = true;
		this.theme.volume = 0.3;
		this.playing = false;

	}
	initialize_new_game(state) {
		//Initial Position
		this.cannon_transform = Mat4.identity().times(Mat4.rotation(0, 1, 0, 0).times(Mat4.translation(0, +1.5, 0)));
		this.wheel_1 = Mat4.identity().times(Mat4.scale(0.5, 0.5, 0.5)).times(Mat4.translation(0, 1.5, 2));
		this.wheel_2 = this.wheel_1.times(Mat4.translation(0, 0, -4));
		//Rocks
		this.rocks = []
		this.create_rock(); 
		this.create_rock();

		this.left = false;
		this.right = false;
		//Score Settings
		if(this.score > this.high_score) this.high_score = Math.ceil(this.score);
		this.score = 0;
		//Bullet
		this.bullets = []
		this.is_game_over = state;

	}



	make_control_panel() {
		// make_control_panel(): Sets up a panel of interactive HTML elements, including
		// buttons with key bindings for affecting this scene, and live info readouts.
		// The next line adds a live text readout of a data member of our Scene.
		this.live_string(box => {
			box.textContent = "Your Score : " + (Math.ceil(this.score)) ;
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
			this.rocks.push(new Rock(0, 13, 1, 0.1, -0.3));
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
			//let desired = this.cannon_transform.post_multiply(Mat4.translation(-1,0,0));
			let desired = this.cannon_transform.times(Mat4.translation(-1, 0, 0));
			this.cannon_transform = desired.map((x, i) => Vector.from(this.cannon_transform[i]).mix(x, 0.1));
			desired = this.wheel_1.times(Mat4.translation(-2, 0, 0));
			this.wheel_1 = desired.map((x, i) => Vector.from(this.wheel_1[i]).mix(x, 0.1));
			desired = this.wheel_2.times(Mat4.translation(-2, 0, 0));
			this.wheel_2 = desired.map((x, i) => Vector.from(this.wheel_2[i]).mix(x, 0.1));
		} else this.left = !this.left;
	}
	move_right() {
		if(this.cannon_transform[0][3] < 6) {
			let desired = this.cannon_transform.times(Mat4.translation(1, 0, 0));
			this.cannon_transform = desired.map((x, i) => Vector.from(this.cannon_transform[i]).mix(x, 0.1));
			desired = this.wheel_1.times(Mat4.translation(2, 0, 0));
			this.wheel_1 = desired.map((x, i) => Vector.from(this.wheel_1[i]).mix(x, 0.1));
			desired = this.wheel_2.times(Mat4.translation(2, 0, 0));
			this.wheel_2 = desired.map((x, i) => Vector.from(this.wheel_2[i]).mix(x, 0.1));
		} else this.right = !this.right;
	}
	shoot_bullet() {
		let array_size = this.bullets.length;
		if(array_size == 0 || this.bullets[array_size - 1].y_pos > 5) //Scaled
		{
			let offset = 0;
			if(this.left) offset = -0.1;
			if(this.right) offset = 0.1;
			this.bullets.push(new Bullet((this.cannon_transform[0][3] + offset) / 0.3, 25));
		}
	}
	create_rock() {
		this.rocks.push(new Rock(Math.floor(Math.random() * 10) - 5, 13, (Math.random() / 1.5) + 0.8, 0.1, -0.3));
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
	update_and_draw_rocks(context, program_state) {
		for(let i = 0; i < this.rocks.length; i++) {
			if(this.rocks[i].check_for_cannon_collision(this.cannon_transform[0][3], 0.7, 2) == 1) // The boulder hit you on your head!!!! Sry Game Over
			{
				this.is_game_over = 1;
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
				}
				///PLAY A SOUND
				this.rocks.splice(i, 1); //Poof, buh-bye!
				i -= 1; //Index adjustment after deleting an element (Rock from Array)
			} 
			else {
				if(ret == -1){}
				    //PLAY COLLISION SOUND
				this.shapes.rock.draw(context, program_state, this.rocks[i].get_model_transform(), this.plastic.override(this.rocks[i].get_color())); //DRAWING happens here
			}
		}
		while(this.rocks.length < 1) {
			this.create_rock();
		}
	}
	populate_grass(context, program_state) {
		// array of box model transforms
		var j = -10;
		while(j < 3) {
			this.populate_grass_horizontal(context, program_state, j);
			j++;
		}
	}
	populate_grass_horizontal(context, program_state, i) {
		// array of box model transforms
		let grass_transform = Mat4.identity().times(Mat4.translation(-11, 0.05, i * 3));
		var j = 0;
		while(j < 9) {
			this.shapes.grass.draw(context, program_state, grass_transform, this.plastic.override(color(0.1, 1, 0.1, 1)));
			grass_transform = grass_transform.times(Mat4.translation(2.9, 0, 0));
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
		let ground_transform = Mat4.identity().times(Mat4.scale(60, 0.001, 60));
		this.shapes.box.draw(context, program_state, ground_transform, this.plastic.override(color(1, 1, 1, 1)));
		this.shapes.box.draw(context, program_state, ground_transform.times(Mat4.translation(0, 10, 0)), this.plastic.override(color(1, 1, 1, 1)));
		let sky_transform = Mat4.identity().times(Mat4.translation(0, 0, -30)).times(Mat4.scale(60, 40, 0.001));
		this.shapes.box.draw(context, program_state, sky_transform, this.plastic.override(color(0, 140, 255, 1)));
		//this.populate_grass(context, program_state);
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
        this.draw_text_static(1, context,program_state, " where  you have to use a cannon ",0.2,-5, 10.5);
        this.draw_text_static(1, context,program_state, "  to shoot bombs at giant rocks to  ",0.2,-5, 10);
        this.draw_text_static(1, context,program_state, "  smash them to smithereens,or in ",0.2,-5, 9.5);
        this.draw_text_static(1, context,program_state, "          this case,coins.",0.2,-5, 9);



       // Fun, frantic and full of fast paced action, Ball Blast tasks you with destroying the slowly advancing blocks and circles before they reach your shooter
	}
	display(context, program_state) {
		//0.016 ------BETTER GRAVITY ;

		if(this.is_game_over == 0) {
			if(this.right) this.move_right();
			if(this.left) this.move_left();
			this.score += 0.06;
			this.set_scene(context, program_state);
			this.shapes.vase.draw(context, program_state, this.cannon_transform, this.bumps);
			this.shapes.wheel.draw(context, program_state, this.wheel_1, this.plastic);
			this.shapes.wheel.draw(context, program_state, this.wheel_2, this.plastic);
			this.update_and_draw_bullets(context, program_state);
			this.update_and_draw_rocks(context, program_state);
		} 
		else if(this.is_game_over == 1) {    //This is the state of the game initially as well as when it is over.
		    this.bullets = [];
		    
			this.set_scene(context, program_state);
		    this.update_and_draw_rocks(context, program_state);
            this.draw_mainscreen_text(context,program_state);
        
		} 
		else if(this.is_game_over == 2){ //RESTART
			this.initialize_new_game(0);
		}
	}
}