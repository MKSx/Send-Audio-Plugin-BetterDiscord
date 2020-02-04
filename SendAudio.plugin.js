//META{"name":"SendAudio","displayName":"SendAudio","website":"https://github.com/MKSx/EnviarAudio-BetterDiscord","source":""}*//
/*@cc_on
@if (@_jscript)
	
	// Offer to self-install for clueless users that try to run this directly.
	var shell = WScript.CreateObject("WScript.Shell");
	var fs = new ActiveXObject("Scripting.FileSystemObject");
	var pathPlugins = shell.ExpandEnvironmentStrings("%APPDATA%\BetterDiscord\plugins");
	var pathSelf = WScript.ScriptFullName;
	// Put the user at ease by addressing them in the first person
	shell.Popup("It looks like you've mistakenly tried to run me directly. \n(Don't do that!)", 0, "I'm a plugin for BetterDiscord", 0x30);
	if (fs.GetParentFolderName(pathSelf) === fs.GetAbsolutePathName(pathPlugins)) {
		shell.Popup("I'm in the correct folder already.", 0, "I'm already installed", 0x40);
	} else if (!fs.FolderExists(pathPlugins)) {
		shell.Popup("I can't find the BetterDiscord plugins folder.\nAre you sure it's even installed?", 0, "Can't install myself", 0x10);
	} else if (shell.Popup("Should I copy myself to BetterDiscord's plugins folder for you?", 0, "Do you need some help?", 0x34) === 6) {
		fs.CopyFile(pathSelf, fs.BuildPath(pathPlugins, fs.GetFileName(pathSelf)), true);
		// Show the user where to put plugins in the future
		shell.Exec("explorer " + pathPlugins);
		shell.Popup("I'm installed!", 0, "Successfully installed", 0x40);
	}
	WScript.Quit();

@else@*/

var SendAudio = (() => {
    const config = {"info":{"name":"Send Audio","authors":[{"name":"Matues","discord_id":"301016626579505162","github_username":"MKSx"}],"version":"1.0.2","description":"Record and send audios in chat","github":"https://github.com/MKSx/EnviarAudio-BetterDiscord","github_raw":"https://raw.githubusercontent.com/MKSx/Send-Audio-Plugin-BetterDiscord/master/SendAudio.plugin.js"},"main":"index.js"};

    return !global.ZeresPluginLibrary ? class {
        constructor() {this._config = config;}
        getName() {return config.info.name;}
        getAuthor() {return config.info.authors.map(a => a.name).join(", ");}
        getDescription() {return config.info.description;}
        getVersion() {return config.info.version;}
        load() {
            const title = "Library Missing";
            const ModalStack = BdApi.findModuleByProps("push", "update", "pop", "popWithKey");
            const TextElement = BdApi.findModuleByProps("Sizes", "Weights");
            const ConfirmationModal = BdApi.findModule(m => m.defaultProps && m.key && m.key() == "confirm-modal");
            if (!ModalStack || !ConfirmationModal || !TextElement) return BdApi.alert(title, `The library plugin needed for ${config.info.name} is missing.<br /><br /> <a href="https://betterdiscord.net/ghdl?url=https://raw.githubusercontent.com/rauenzi/BDPluginLibrary/master/release/0PluginLibrary.plugin.js" target="_blank">Click here to download the library!</a>`);
            ModalStack.push(function(props) {
                return BdApi.React.createElement(ConfirmationModal, Object.assign({
                    header: title,
                    children: [BdApi.React.createElement(TextElement, {color: TextElement.Colors.PRIMARY, children: [`The library plugin needed for ${config.info.name} is missing. Please click Download Now to install it.`]})],
                    red: false,
                    confirmText: "Download Now",
                    cancelText: "Cancel",
                    onConfirm: () => {
                        require("request").get("https://rauenzi.github.io/BDPluginLibrary/release/0PluginLibrary.plugin.js", async (error, response, body) => {
                            if (error) return require("electron").shell.openExternal("https://betterdiscord.net/ghdl?url=https://raw.githubusercontent.com/rauenzi/BDPluginLibrary/master/release/0PluginLibrary.plugin.js");
                            await new Promise(r => require("fs").writeFile(require("path").join(ContentManager.pluginsFolder, "0PluginLibrary.plugin.js"), body, r));
                        });
                    }
                }, props));
            });
        }
        start() {}
        stop() {}
    } : (([Plugin, Api]) => {
        const plugin = (Plugin, Api) => {
	const {PluginUtilities, DiscordModules} = Api;

	const SelectedChannelStore = DiscordModules.SelectedChannelStore;
	const ChannelStore = DiscordModules.ChannelStore;

	const Upload = BdApi.findModule(m => m.upload && typeof m.upload === 'function');

	const Chat = BdApi.findModuleByProps('chat').chat.split(" ")[0];

	const getTextArea = () => {

		try{
			let chat = document.getElementsByClassName(Chat)[0].getElementsByTagName("textarea");

			return (chat ? chat[0] : null);
		}
		catch(error){
			return null;
		}
	};

	const loadButtons = (plugin) => {
		let element = document.getElementById('audio_buttons');

		if(!element){
			let buttons205 = document.querySelector('.buttons-3JBrkn');

			if(!buttons205){
				return false;
			}
			element = document.createElement('div');
			element.id = 'audio_buttons';
			element.style.display = 'inherit';
			element.innerHTML = `
				<button class="mic-button" id='record_audio'>
					<span data-icon="ptt">
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
							<path d="M11.999 14.942c2.001 0 3.531-1.53 3.531-3.531V4.35c0-2.001-1.53-3.531-3.531-3.531S8.469 2.35 8.469 4.35v7.061c0 2.001 1.53 3.531 3.53 3.531zm6.238-3.53c0 3.531-2.942 6.002-6.237 6.002s-6.237-2.471-6.237-6.002H3.761c0 4.001 3.178 7.297 7.061 7.885v3.884h2.354v-3.884c3.884-.588 7.061-3.884 7.061-7.885h-2z"></path>
						</svg>
					</span>
				</button>
				<div id='recording' style='display: none;'>
					<button class="mic-trash" id='delete_audio' style='display: flex;'>
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 475.2 475.2">
							<path d="M405.6,69.6C360.7,24.7,301.1,0,237.6,0s-123.1,24.7-168,69.6S0,174.1,0,237.6s24.7,123.1,69.6,168s104.5,69.6,168,69.6s123.1-24.7,168-69.6s69.6-104.5,69.6-168S450.5,114.5,405.6,69.6z M386.5,386.5c-39.8,39.8-92.7,61.7-148.9,61.7s-109.1-21.9-148.9-61.7c-82.1-82.1-82.1-215.7,0-297.8C128.5,48.9,181.4,27,237.6,27s109.1,21.9,148.9,61.7C468.6,170.8,468.6,304.4,386.5,386.5z"></path>
							<path d="M342.3,132.9c-5.3-5.3-13.8-5.3-19.1,0l-85.6,85.6L152,132.9c-5.3-5.3-13.8-5.3-19.1,0c-5.3,5.3-5.3,13.8,0,19.1l85.6,85.6l-85.6,85.6c-5.3,5.3-5.3,13.8,0,19.1c2.6,2.6,6.1,4,9.5,4s6.9-1.3,9.5-4l85.6-85.6l85.6,85.6c2.6,2.6,6.1,4,9.5,4c3.5,0,6.9-1.3,9.5-4c5.3-5.3,5.3-13.8,0-19.1l-85.4-85.6l85.6-85.6C347.6,146.7,347.6,138.2,342.3,132.9z"></path>
						</svg>
					</button>
					<div class='record-time' id='div_temp_audio' style="display: flex;">
						<svg class="flash-record" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
							<path fill="#FF0000" d="M504.1,256C504.1,119,393,7.9,256,7.9C119,7.9,7.9,119,7.9,256C7.9,393,119,504.1,256,504.1C393,504.1,504.1,393,504.1,256z"></path>
						</svg>
						<input type="text" id='audio_time' value="00:00:00" readonly="">
					</div>

					<button class='mic-send' id='send_audio' style='display: flex;'>
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" enable-background="new 0 0 512 512" xml:space="preserve">
							<path d="M504.1,256C504.1,119,393,7.9,256,7.9C119,7.9,7.9,119,7.9,256C7.9,393,119,504.1,256,504.1C393,504.1,504.1,393,504.1,256z"></path>
							<path d="M392.6,172.9c-5.8-15.1-17.7-12.7-30.6-10.1c-7.7,1.6-42,11.6-96.1,68.8c-22.5,23.7-37.3,42.6-47.1,57c-6-7.3-12.8-15.2-20-22.3C176.7,244.2,152,229,151,228.4c-10.3-6.3-23.8-3.1-30.2,7.3c-6.3,10.3-3.1,23.8,7.2,30.2     c0.2,0.1,21.4,13.2,39.6,31.5c18.6,18.6,35.5,43.8,35.7,44.1c4.1,6.2,11,9.8,18.3,9.8c1.2,0,2.5-0.1,3.8-0.3c8.6-1.5,15.4-7.9,17.5-16.3c0.1-0.2,8.8-24.3,54.7-72.7c37-39.1,61.7-51.5,70.3-54.9c0.1,0,0.1,0,0.3,0c0,0,0.3-0.1,0.8-0.4c1.5-0.6,2.3-0.8,2.3-0.8c-0.4,0.1-0.6,0.1-0.6,0.1l0-0.1c4-1.7,11.4-4.9,11.5-5C393.3,196.1,397,184.1,392.6,172.9z"></path>
						</svg>
					</button>
				</div>
			`;
			buttons205.appendChild(element);
			try{
				document.getElementById('record_audio').addEventListener('click', () => {plugin.onMicClick();});

				document.getElementById('delete_audio').addEventListener('click', () => {plugin.setDefaultButtons();});

				document.getElementById('send_audio').addEventListener('click', () => {plugin.onSendAudio();});
			}
			catch(err){
				console.error("%c[%s]:", "color: #0f62de;font-weight: bold;", plugin.getName(), err);
				loadButtons(plugin);
			}
			return true;
		}
		return false;
	};

	const setButtonRecord = (plugin) =>{
		if(!document.getElementById('audio_buttons'))
			return false;

		try{
			document.getElementById('record_audio').style.display = 'none';
			document.getElementById('recording').style.display = 'flex';
			return true;
		}
		catch(err){
			console.error("%c[%s]:", "color: #0f62de;font-weight: bold;", plugin.getName(), err);
		}
		return false;
	};

	const randomInt = (max, min) => {
		return Math.floor(Math.random() * (max - min + 1)) + min;
	};

	const randomKey = () => {
		return String.fromCharCode(randomInt(65, 90)) + String.fromCharCode(randomInt(48, 57)) + String.fromCharCode(randomInt(97, 122));
	};

	return class SendPlugin extends Plugin{
		onStart(){
			PluginUtilities.addStyle(this.getName(), `
				.mic-button{background: transparent;margin: 7px 0;}
				.mic-button span svg{width: 24px;height: 24px;fill: var(--interactive-normal);transform: scale(1);}
				.mic-button:hover span svg{transform: scale(1.14);fill: var(--interactive-active);}
				.mic-trash{background: transparent;margin: 7px 0;}
				.mic-trash svg{width: 24px;height: 24px;fill: #cc3d3d;fill-opacity: 100;transform: scale(1);}
				.mic-trash:hover svg{transform: scale(1.14);fill: red;}
				.mic-send{background: transparent;margin: 7px 2px;}
				.mic-send svg{width: 24px;height: 24px;border: 1px solid rgb(50, 190, 166);border-radius: 590%;}
				.mic-send svg path:first-child{fill: transparent;border: 1px solid rgb(50, 190, 166);}
				.mic-send svg path:last-child{fill: rgb(50, 190, 166);}
				.mic-send:hover svg{transform: scale(1.14);}
				.flash-record{width: 14px;height: 14px;position: relative;top: 2px;margin: 0 2px;animation: flash linear 1s infinite;}
				@keyframes flash{0% {opacity: 1;}50% {opacity: .1;}100% {opacity: 1;}}
				.record-time{display: flex;align-items: center;}
				.record-time input{cursor: default;margin-left: 5px;background: transparent;color: var(--text-normal);width: 4.2em;border: none;}
			`);
			this.record = {
				media: null,
				audioChunks: [],
				audioBlob: null,
				started: false,
			};

			navigator.mediaDevices.getUserMedia({audio: true}).then(stream => {
	            this.record.media = new MediaRecorder(stream);
	            this.record.media.addEventListener('dataavailable', event => {
	               this.record.audioChunks.push(event.data);
	            });
	        });

			this.timer = null;

			this.onSwitch();

		}
		onStop(){
			let element = document.getElementById('audio_buttons');

			if(element){
				element.outerHTML = '';
			}

			if(this.timer != null){
				clearInterval(this.timer);
				this.timer = null;
			}
			if(this.record && this.record.media){
				this.resetRecord();
			}
		}
		onSwitch(){

			const uploadButton = document.getElementsByClassName('attachButton-2WznTc');

			const channel = ChannelStore.getChannel(SelectedChannelStore.getChannelId());

			if(!channel || !uploadButton || uploadButton[0] == undefined){
				return;
			}
			
			loadButtons(this);
			this.setDefaultButtons();
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
				document.getElementById('record_audio').style.display = '';
				document.getElementById('audio_time').value = '00:00:00';
				document.getElementById('recording').style.display = 'none';
			}
			catch(error){
				console.error("%c[%s]:", "color: #0f62de;font-weight: bold;", this.getName(), error);
				element.outerHTML = '';
				loadButtons(this);
			}
		}
		onMicClick(){
			setButtonRecord(this);
			let element = document.getElementById('audio_time');
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
		onSendAudio(){
			this.stopRecord();

			setTimeout(() => {
				this.onRecordStoped();
			},0);
			this.setDefaultButtons();
		}

		onRecordStoped(){
			const channel = ChannelStore.getChannel(SelectedChannelStore.getChannelId());

			if(!channel || !this.record.started || this.record.media == 'recording'){
				return false;
			}

			let date_ = new Date();

			date_ = new Date(date_.getTime() - (date_.getTimezoneOffset() * 60000)).toISOString();

			const fname = randomKey() + '-'  + date_.substr(0, 10) + '-' + date_.substr(11, 8).replace(/:/g, '-') + '.ogg';

			Upload.upload(channel.id, new File([this.record.audioBlob], fname), {content: '', tts: false});
		}

		resetRecord(){
			if(this.record.media != null && this.record.started){
	            if(!this.record.media.state == 'recording'){
	                this.record.media.stop();
	            }
	            this.record.audioChunks = [];
	            this.record.audioBlob = null;
	            this.record.started = false;
	            this.record.audio = null;
	            this.record.audioURL = null;
	        }
		}
		startRecord(){
			if(this.record.media == null)
				return false;
			try{
				if(this.record.started){
					this.resetRecord();
				}
				this.record.media.start();
				this.record.started = true;
				return true
			}
			catch(error){
				console.error("%c[%s]:", "color: #0f62de;font-weight: bold;", this.getName(), error);
				return false;
			}
		}
		stopRecord(){
			if(this.record.media == null)
				return false;

			try{
				if(this.record.media.state == 'recording'){
					this.record.media.addEventListener('stop', () => {
						this.record.audioBlob = new Blob(this.record.audioChunks, {type: 'audio/ogg'});
					});
					this.record.media.stop();
					return true;
				}
				return false;
			}
			catch(error){
				console.error("%c[%s]:", "color: #0f62de;font-weight: bold;", this.getName(), error);
				return false;
			}

		}
	};
};
        return plugin(Plugin, Api);
    })(global.ZeresPluginLibrary.buildPlugin(config));
})();
/*@end@*/
