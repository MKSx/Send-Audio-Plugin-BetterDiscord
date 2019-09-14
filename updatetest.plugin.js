//META{"name": "UpdateTest", "version": "0.1.3", "source": "https://github.com/MKSx/EnviarAudio-BetterDiscord/blob/master/updatetest.plugin.js"}*//

class UpdateTest{
	getName(){
		return "Update Test";
	}
	getVersion(){
		return "0.1.3";
	}
	getAuthor(){
		return "Matues";
	}
	getDescription(){
		return "Plugin para testar o sistema o update";
	}

	load(){}


	start(){
		console.log("Plugin Iniciado");
	}
	stop(){}

	onSwitch(){
		console.log("SWITCH2");
	}
}
