import RainbowText from 'objects/RainbowText';
import SocketHandler from 'SocketHandler';
class GameState extends Phaser.State {

	preload(){
		//load the spritesheet and atlas
		this.game.load.atlasJSONHash('playerSprites', 'assets/player_spritesheet.png', 'assets/player_spritemap.json');
		this.game.load.atlas('coinSprites', 'assets/coin_spritesheet.png', 'assets/coin_spritemap.json');
		this.game.load.image('background', 'assets/background.png');
		this.game.load.image('grass', 'assets/Grass.png');
		this.socketHandler = new SocketHandler(this);
	}

	create() {
		this.game.physics.startSystem(Phaser.Physics.ARCADE);
		this.socketHandler.addServerUpdateHandler(this.updateGame);
		//background
		this.game.add.sprite(0,0,'background');

		//ground
		this.ground = this.game.add.group();
		this.ground.enableBody = true;
		for(let i = -12; i < 1000; i+=128)
		{
			let temp = this.ground.create(i, 550, 'grass');
			temp.body.immovable = true;
			temp.body.setSize(114, 128, 0, 14);
			temp.scale.setTo(1, .5);
		}
		//coin
		this.coinDict = {};

		//initialize local player
		this.player = this.game.add.sprite(500,0,'playerSprites');
		this.game.physics.arcade.enable(this.player);
		this.player.body.gravity.y = 1000;
    this.player.body.collideWorldBounds = true;
		this.player.anchor.setTo(0.5, 1);
		this.player.animations.add('jumpUp', ['jumpUp'], 15, false);
		this.player.animations.add('jumpDown', ['jumpDown'], 15, false);
		this.player.animations.add('run', ['run1', 'run2', 'run3', 'run 4', 'run5', 'run6',
																			 'run7', 'run8', 'run9', 'run10', 'run11', 'run12',
																			 'run13', 'run14', 'run15', 'run16', 'run17', 'run18'
																		 ], 45, true);

		//initialize enemy
		this.enemies = this.game.add.group();
		this.enemyDict = {};

		//Text
		var style = { font: "bold 32px Arial", fill: "#fff", boundsAlignH: "center", boundsAlignV: "middle" };
    this.scoreText = this.game.add.text(10, 0, "score: ", style);
    //this.scoreText.setShadow(3, 3, 'rgba(0,0,0,0.5)', 2);
    //this.scoreText.setTextBounds(0, 100, 800, 100);
	}

	update() {
		let playerCollision = this.game.physics.arcade.collide(this.player, this.enemies);
		let groundCollision = this.game.physics.arcade.collide(this.player, this.ground) || this.game.physics.arcade.collide(this.enemies, this.ground);
		for(let k in this.coinDict)
		{
			let coinCollision = this.game.physics.arcade.collide(this.player, this.coinDict[k]) ||
													this.game.physics.arcade.collide(this.enemies, this.coinDict[k]);
			if(coinCollision)
			{
				this.coinDict[k].destroy();
				delete this.coinDict[k];
			}
		}
		let cursors = this.game.input.keyboard.createCursorKeys();

		//moving left and right
		if(cursors.right.isDown){
			//this.player.scale.x = Math.abs(this.player.scale.x);
			this.player.body.velocity.x = 500;
		}
		else if(cursors.left.isDown){
			//this.player.scale.x = -1 * Math.abs(this.player.scale.x);
			this.player.body.velocity.x = -500;
		}
		else {
			this.player.body.velocity.x = 0;
		}

		//jumping
		let onSomething = this.player.body.onFloor() || this.player.body.touching.down;
		if (cursors.up.isDown && onSomething)
    {
        this.player.body.velocity.y = -500;
    }

		//animation
		this.animatePlayer(this.player);
		for(let key in this.enemyDict){
			this.animatePlayer(this.enemyDict[key]);
		}


		this.socketHandler.sendUpdateToServer(this.player.position.x, this.player.position.y,
																					this.player.body.velocity.x || 0, this.player.body.velocity.y || 0);
	}

	animatePlayer(player){
		let onSomething = player.body.onFloor() || this.player.body.touching.down;
		if((player.body.position.x + 1 < player.body.prev.x && player.scale.x > 0) || //if last move was left but facing right
			 (player.body.position.x > player.body.prev.x + 1 && player.scale.x < 0))   //if last move was right but facing left
		{
			player.scale.x *= -1; //flip
		}

		if(onSomething) //on ground
		{
			if(Math.abs(player.body.position.x - player.body.prev.x) >  1)
				player.animations.play("run");
			else
				player.animations.stop();
		}else if (Math.abs(player.body.position.y - player.body.prev.y) > 1){ //fallling
			if(player.body.velocity.y < -5)
				player.animations.play('jumpUp');
			else
				player.animations.play('jumpDown');
		}
	}

	updateGame(data)
	{
		this.updateAllPlayers(data.players);
		this.updateAllCoins(data.coins);
	}

	updateAllPlayers(data)
	{
		for(let playerKey of Object.keys(data))
		{
			if(!this.socketHandler.isMe(playerKey)) //if this isn't the local player
			{
				if(!(playerKey in this.enemyDict))
				{
					let temp = this.enemies.create(0, 0, 'playerSprites');
					this.game.physics.arcade.enable(temp);
			    temp.body.collideWorldBounds = true;
					temp.body.immovable = true;
					//temp.body.gravity.y = 1000;
					temp.anchor.setTo(0.5, 1);
					temp.animations.add('jumpUp', ['jumpUp'], 15, false);
					temp.animations.add('jumpDown', ['jumpDown'], 15, false);
					temp.animations.add('run', ['run1', 'run2', 'run3', 'run 4', 'run5', 'run6',
																						 'run7', 'run8', 'run9', 'run10', 'run11', 'run12',
																						 'run13', 'run14', 'run15', 'run16', 'run17', 'run18'
																					 ], 45, true);
					this.enemyDict[playerKey] = temp;
				}
				let currPlayer = this.enemyDict[playerKey];
				let currData = data[playerKey];
				if(Math.abs(currPlayer.position.x - currData.x) > 3 || Math.abs(currPlayer.position.y - currData.y) > 3)
				{
					currPlayer.body.velocity.setTo(0,0);
					this.game.physics.arcade.moveToXY(currPlayer, currData.x, currData.y, 0, 100);
					console.log(`at ${currPlayer.position.x},${currPlayer.position.y} moving to ${currData.x},${currData.y}`);
				}else{
					currPlayer.body.velocity.setTo(0,0);
				}
				//console.log(currPlayer.body.velocity.x, currPlayer.body.velocity.y);
			}else{
				this.scoreText.setText("score: " + data[playerKey].score)
			}
		}
		this.deleteDisconnectedPlayers(data);
	}

	updateAllCoins(data)
	{
		for(let k of Object.keys(this.coinDict)){
			if(!(k in data))
			{
				this.coinDict[k].destroy();
				delete this.coinDict[k];
			}else{
				this.game.physics.arcade.moveToXY(this.coinDict[k], data[k].x, data[k].y, 100, 100);
			}
		}
		for(let k of Object.keys(data))
		{
			if(!(k in this.coinDict))
			{
				let coin = this.game.add.sprite(data[k].x,data[k].y,'coinSprites');
				this.game.physics.arcade.enable(coin);
				coin.animations.add('spin', [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15], 30, true);
				coin.animations.play('spin');
				coin.anchor.setTo(0.5, 0.5);
				coin.scale.setTo(0.75, 0.75);
				this.coinDict[k] = coin;
			}
		}
	}

	deleteDisconnectedPlayers(data){
		for(let enemyKey of Object.keys(this.enemyDict)){
			if(!(enemyKey in data)){
				this.enemyDict[enemyKey].destroy(); //kill inside of group
				delete this.enemyDict[enemyKey]; //remove from the dictionary
			}
		}
	}

	render(){
		//this.game.debug.body(this.player, 32, 32);
	}


}

export default GameState;
