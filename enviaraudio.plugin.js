//META{"name": "AudioPlugin", "source": "https://github.com/MKSx/EnviarAudio-BetterDiscord/blob/master/enviaraudio.plugin.js", "website": "https://github.com/MKSx/EnviarAudio-BetterDiscord"}*//

class RecordAudio{
    constructor(){
        this.record = null;
        this.audioChunks = [];
        this.audioBlob = null;
        this.stoped = false;
        this.started = false;

        this.audio = null;

        navigator.mediaDevices.getUserMedia({audio: true}).then(stream => {
            this.record = new MediaRecorder(stream);
            this.record.addEventListener('dataavailable', event => {
               this.audioChunks.push(event.data);
            });
        });
    }
    start(){
        if(this.record != null && !this.started){
            this.record.start();
            this.started = true;
            return true;
        }
        return false;
    }
    stop(){
        if(this.record != null && (this.started && !this.stoped)){
            this.record.addEventListener('stop', () => {
                this.audioBlob = new Blob(this.audioChunks, {type: 'audio/ogg'});
              
                this.audio = new Audio(URL.createObjectURL(this.audioBlob));

                this.stoped = true;
            });
            this.record.stop();
            return true;
        }
        return false;
    }

    reset(){
        if(this.record != null && this.started){
            if(!this.stoped){
                this.stop();
            }
            this.audioChunks = [];
            this.audioBlob = null;
            this.stoped = false;
            this.started = false;
        }
    }
    play(){
    	if(this.started && this.stoped){
    		var promise = this.audio.play();

    		if(promise != undefined){
    			promise.then(_ => {
    				this.audio.pause();
    			}).catch(error => {
    				console.error('RecordAudio', error);
    			});
    		}

    		return true;
    	}
    	return false;
    }
}

class AudioPlugin{
	getName(){
		return 'Envia Áudio';
	}
	getDescription(){
		return 'Grava e envia áudios no chat.';
	}
	getVersion(){return '1.3.2';}
	getAuthor(){
		return 'Matues';
	}

	load(){}

	getSelectedTextChannel(){
		return BDV2.WebpackModules.find(module => ["getChannel", "getChannels"].every(module_name => module[module_name] != undefined))['getChannel'](BDV2.WebpackModules.find(module => ["getChannelId", "getVoiceChannelId"].every(module_name => module[module_name] != undefined))['getChannelId']());
	}
	start(){
	

		let lib = document.getElementById('EnviarAudioPlugin');
		if(!lib){
			lib = document.createElement('style');
			lib.id = 'EnviarAudioPlugin';
			lib.innerHTML = `
				.mic-button{background: transparent;margin: 7px 0;}
				.mic-button span svg{width: 24px;height: 24px;fill: #dcddde;fill-opacity: 0.45;transform: scale(1);}
				.mic-button:hover span svg{transform: scale(1.14);fill: white !important;fill-opacity: 100;}
				.mic-trash{background: transparent;margin: 7px 0;}
				.mic-trash svg{width: 24px;height: 24px;fill: #cc3d3d;fill-opacity: 100;transform: scale(1);}
				.mic-trash:hover svg{transform: scale(1.14);fill: red;}
				.mic-send{background: transparent;margin: 7px 0;}
				.mic-send svg{width: 24px;height: 24px;border: 1px solid rgb(50, 190, 166);border-radius: 590%;}
				.mic-send svg path:first-child{fill: transparent;border: 1px solid rgb(50, 190, 166);}
				.mic-send svg path:last-child{fill: #dcddde;fill-opacity: 100;}
				.mic-send:hover svg{transform: scale(1.14);}
				.flash-record{width: 14px;height: 14px;position: relative;top: 2px;margin: 0 2px;animation: flash linear 1s infinite;}
				@keyframes flash{0% {opacity: 1;}50% {opacity: .1;}100% {opacity: 1;}}
				.record-time{display: flex;align-items: center;}
				.record-time input{margin-left: 5px;background: transparent;color: #dcddde;width: 4.2em;border: none;}
			`;
			document.head.appendChild(lib);
		}

		lib = document.getElementById("ZLibraryScript");

		if(!lib || !window.ZLibrary){
			if(lib) lib.parentElement.removeChild(lib);

			lib = document.createElement("script");
            lib.setAttribute("type", "text/javascript");
            lib.setAttribute("src", "https://rauenzi.github.io/BDPluginLibrary/release/ZLibrary.js");
            lib.setAttribute("id", "ZLibraryScript");
            document.head.appendChild(lib);
		}

		if(window.ZLibrary) this.initialize();
        else lib.addEventListener("load", () => { this.initialize(); });
		
	}
	initialize(){
		this.timer = null;

		this.record = new RecordAudio();

		this.onSwitch();

	 	ZLibrary.PluginUpdater.checkForUpdate(this.getName(), this.getVersion(), "https://raw.githubusercontent.com/MKSx/EnviarAudio-BetterDiscord/master/enviaraudio.plugin.js");
	}
	onSwitch(){
		const chatbox = this.getSelectedTextChannel();
		const uploadButton = document.getElementsByClassName('attachButton-1UjEWA');

		if(chatbox == undefined || uploadButton == undefined || uploadButton[0] == undefined){
			return;
		}
		this.loadButtons();
		this.setDefaultButtons();
	}

	stop(){

		let element = document.getElementById('audio_buttons');

		if(element){
			element.outerHTML = '';
		}

		element = document.getElementById('EnviarAudioPlugin');
		if(element){
			element.outerHTML = '';
		}
		if(this.timer != null){
			this.timer = null;
			clearInterval(this.timer);
		}
		if(this.record != null){
			this.stopRecord();
		}
	}


	loadButtons(){
		let element = document.getElementById('audio_buttons');
		if(!element){
			let buttons205 = document.querySelector('.buttons-205you');

			if(!buttons205){
				return;
			}

			element = document.createElement('div');
			element.id = 'audio_buttons';
			element.style.display = 'inherit';
			element.innerHTML = `
				<button class="mic-button" id='gravar_audio'>
					<span data-icon="ptt">
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
							<path d="M11.999 14.942c2.001 0 3.531-1.53 3.531-3.531V4.35c0-2.001-1.53-3.531-3.531-3.531S8.469 2.35 8.469 4.35v7.061c0 2.001 1.53 3.531 3.53 3.531zm6.238-3.53c0 3.531-2.942 6.002-6.237 6.002s-6.237-2.471-6.237-6.002H3.761c0 4.001 3.178 7.297 7.061 7.885v3.884h2.354v-3.884c3.884-.588 7.061-3.884 7.061-7.885h-2z"></path>
						</svg>
					</span>
				</button>
				<button class="mic-trash" id='deletar_audio' style='display: none;'>
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 475.2 475.2">
						<path d="M405.6,69.6C360.7,24.7,301.1,0,237.6,0s-123.1,24.7-168,69.6S0,174.1,0,237.6s24.7,123.1,69.6,168s104.5,69.6,168,69.6s123.1-24.7,168-69.6s69.6-104.5,69.6-168S450.5,114.5,405.6,69.6z M386.5,386.5c-39.8,39.8-92.7,61.7-148.9,61.7s-109.1-21.9-148.9-61.7c-82.1-82.1-82.1-215.7,0-297.8C128.5,48.9,181.4,27,237.6,27s109.1,21.9,148.9,61.7C468.6,170.8,468.6,304.4,386.5,386.5z"></path>
						<path d="M342.3,132.9c-5.3-5.3-13.8-5.3-19.1,0l-85.6,85.6L152,132.9c-5.3-5.3-13.8-5.3-19.1,0c-5.3,5.3-5.3,13.8,0,19.1l85.6,85.6l-85.6,85.6c-5.3,5.3-5.3,13.8,0,19.1c2.6,2.6,6.1,4,9.5,4s6.9-1.3,9.5-4l85.6-85.6l85.6,85.6c2.6,2.6,6.1,4,9.5,4c3.5,0,6.9-1.3,9.5-4c5.3-5.3,5.3-13.8,0-19.1l-85.4-85.6l85.6-85.6C347.6,146.7,347.6,138.2,342.3,132.9z"></path>
					</svg>
				</button>
				<div class='record-time' id='div_temp_audio' style="display: none;">
					<svg class="flash-record" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
						<path fill="#FF0000" d="M504.1,256C504.1,119,393,7.9,256,7.9C119,7.9,7.9,119,7.9,256C7.9,393,119,504.1,256,504.1C393,504.1,504.1,393,504.1,256z"></path>
					</svg>
					<input type="text" id='tempo_audio' value="00:00:00" readonly="">
				</div>

				<button class='mic-send' id='enviar_audio' style='display: none;'>
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" enable-background="new 0 0 512 512" xml:space="preserve">
						<path d="M504.1,256C504.1,119,393,7.9,256,7.9C119,7.9,7.9,119,7.9,256C7.9,393,119,504.1,256,504.1C393,504.1,504.1,393,504.1,256z"></path>
						<path d="M392.6,172.9c-5.8-15.1-17.7-12.7-30.6-10.1c-7.7,1.6-42,11.6-96.1,68.8c-22.5,23.7-37.3,42.6-47.1,57c-6-7.3-12.8-15.2-20-22.3C176.7,244.2,152,229,151,228.4c-10.3-6.3-23.8-3.1-30.2,7.3c-6.3,10.3-3.1,23.8,7.2,30.2     c0.2,0.1,21.4,13.2,39.6,31.5c18.6,18.6,35.5,43.8,35.7,44.1c4.1,6.2,11,9.8,18.3,9.8c1.2,0,2.5-0.1,3.8-0.3c8.6-1.5,15.4-7.9,17.5-16.3c0.1-0.2,8.8-24.3,54.7-72.7c37-39.1,61.7-51.5,70.3-54.9c0.1,0,0.1,0,0.3,0c0,0,0.3-0.1,0.8-0.4c1.5-0.6,2.3-0.8,2.3-0.8c-0.4,0.1-0.6,0.1-0.6,0.1l0-0.1c4-1.7,11.4-4.9,11.5-5C393.3,196.1,397,184.1,392.6,172.9z"></path>
					</svg>
				</button>
			`;
			buttons205.appendChild(element);

			const onMC = () => {
				this.onMicrophoneClick();
			};

			const onDA = () => {
				this.onDeleteAudioClick();
			};

			const onSA = () => {
				this.onSendAudioClick();
			};

			try{
				document.getElementById('gravar_audio').addEventListener('click', onMC);

				document.getElementById('deletar_audio').addEventListener('click', onDA);

				document.getElementById('enviar_audio').addEventListener('click', onSA);
			}
			catch(err){
				console.error(this.getName(), err);
				this.loadButtons();
			}
		}
	}
	setDefaultButtons(){
		if(this.timer != null){
			clearInterval(this.timer);
			this.timer = null;
		}

		this.stopRecord();

		let element = document.getElementById('audio_buttons');
		if(!element){
			return;
		}

		try{
			document.getElementById('gravar_audio').style.display = '';
			document.getElementById('deletar_audio').style.display = 'none';
			document.getElementById('div_temp_audio').style.display = 'none';
			document.getElementById('tempo_audio').value = '00:00:00';
			document.getElementById('enviar_audio').style.display = 'none';
		}
		catch(err){
			console.error(this.getName(), err);
			element.outerHTML = '';
			this.loadButtons();
		}

	}
	setButtonRecord(){
		let element = document.getElementById('audio_buttons');
		if(!element){
			return;
		}
		document.getElementById('gravar_audio').style.display = 'none';;
		document.getElementById('deletar_audio').style.display = 'flex';
		document.getElementById('div_temp_audio').style.display = 'flex';
		document.getElementById('enviar_audio').style.display = 'flex';
		return 1;
	}
	onMicrophoneClick(){
		this.setButtonRecord();

		let element = document.getElementById('tempo_audio');
		let seconds = 0;
		if(element){
			this.startRecord();

			this.timer = setInterval(() => {
				seconds++;
				element.value = new Date(seconds * 1000).toISOString().substr(11, 8);

			}, 1000);

		}
		else{
			this.setDefaultButtons();
		}
	}
	onDeleteAudioClick(){
		this.setDefaultButtons();
	}
	onSendAudioClick(){
		this.stopRecord();

		setTimeout(() => {
			this.onRecordStoped();
		},0);
		this.setDefaultButtons();
	}

	startRecord(){
		try{
			if(this.record.started){
				if(!this.record.stoped){
					this.record.stop();
				}
				this.record.reset();
			}
			return this.record.start();
		}
		catch(erro){
			return false;
		}
	}
	stopRecord(){
		try{
			if(!this.record.stop()){
				return false;
			}
			return true;
		}
		catch(erro){
			return false;
		}

	}
	playRecord(){
		try{
			if(!this.record.started){
				return false;
			}
			if(!this.record.stoped){
				if(!this.stopRecord()){
					return false;
				}
			}
			setTimeout(() => {
				return this.record.play();
			}, 100);
		}
		catch(error){
			console.error(this.getName() + '.playRecord()', error);
			return false;
		}
	}
	onRecordStoped(){
		const selectedChannel = this.getSelectedTextChannel();
		let date_ = new Date();

		date_ = new Date(date_.getTime() - (date_.getTimezoneOffset() * 60000)).toISOString();

		const fname = this.randomKey() + '-'  + date_.substr(0, 10) + '-' + date_.substr(11, 8).replace(/:/g, '-') + '.ogg';

		if(selectedChannel == undefined){
			return;
		}
		BDV2.WebpackModules.find(m => m.upload && typeof m.upload === 'function').upload(selectedChannel.id, new File([this.record.audioBlob], fname), {content: '', tts: false});
		this.playRecord();
	}
	random(max, min){
		return Math.floor(Math.random() * (max - min + 1)) + min;
	}
	randomKey(){
		return String.fromCharCode(this.random(65, 90)) + String.fromCharCode(this.random(48, 57)) + String.fromCharCode(this.random(97, 122));
	}
}
