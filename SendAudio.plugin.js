//META{"name":"SendAudio","displayName":"SendAudio","website":"https://github.com/MKSx/EnviarAudio-BetterDiscord","source":"https://raw.githubusercontent.com/MKSx/Send-Audio-Plugin-BetterDiscord/master/SendAudio.plugin.js"}*//
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

if(!('SendAudio_downloadModal' in global))
	global.SendAudio_downloadModal = false;

var SendAudio = (() => {
	const config = {"info":{"name":"Send Audio","authors":[{"name":"Matues","discord_id":"301016626579505162","github_username":"MKSx"}],"version":"1.1.0","description":"Record and send audios in chat","github":"https://github.com/MKSx/EnviarAudio-BetterDiscord","github_raw":"https://raw.githubusercontent.com/MKSx/Send-Audio-Plugin-BetterDiscord/master/SendAudio.plugin.js"},"main":"index.js","defaultConfig":[{"type":"switch","name":"Preview the audio before sending","id":"preview","value":true},{"type":"switch","name":"Increases the audio size limit from 8 MB to 50 MB (if you are a nitro user)","id":"nitro","value":false}],"changelog":[{"title":"Add","items":["Audio preview","Continue recording on other channels","Pause/Resume recording","File size limit, 50 MB for nitro users and 8 MB for others"]}]};

	//local lib not found
	if(typeof global.ZeresPluginLibrary != 'function'){
		//Add remote lib
		if (!global.ZLibrary && !global.ZLibraryPromise) global.ZLibraryPromise = new Promise((resolve, reject) => {
			require("request").get({url: "https://rauenzi.github.io/BDPluginLibrary/release/ZLibrary.js", timeout: 10000}, (err, res, body) => {
				if (err || 200 !== res.statusCode) return reject(err || res.statusMessage);
				try {const vm = require("vm"), script = new vm.Script(body, {displayErrors: true}); resolve(script.runInThisContext());}
				catch(err) {reject(err);}
			});
		});

		const title = "Library Missing";
        const ModalStack = BdApi.findModuleByProps("push", "update", "pop", "popWithKey");
        const TextElement = BdApi.findModuleByProps("Sizes", "Weights");
        const ConfirmationModal = BdApi.findModule(m => m.defaultProps && m.key && m.key() == "confirm-modal");
        
      
        if (!ModalStack || !ConfirmationModal || !TextElement) {
            return BdApi.alert(title, `The library plugin needed for ${config.info.name} is missing.<br /><br /> <a href="https://betterdiscord.net/ghdl?url=https://raw.githubusercontent.com/rauenzi/BDPluginLibrary/master/release/0PluginLibrary.plugin.js" target="_blank">Click here to download the library!</a>`);
        }

        //download lib
        if(!global.SendAudio_downloadModal){
        	global.SendAudio_downloadModal = true;
	        ModalStack.push(function(props){
	        	
	            return BdApi.React.createElement(ConfirmationModal, Object.assign({
	                header: title,
	                children: [BdApi.React.createElement(TextElement, {color: TextElement.Colors.PRIMARY, children: [`The library plugin needed for ${config.info.name} is missing. Please click Download Now to install it.`]})],
	                red: false,
	                confirmText: "Download Now",
	                cancelText: "Cancel",
	                onConfirm: () => {
	                    require("request").get("https://rauenzi.github.io/BDPluginLibrary/release/0PluginLibrary.plugin.js", async (error, response, body) => {
	                        if (error)
	                        	return require("electron").shell.openExternal("https://betterdiscord.net/ghdl?url=https://raw.githubusercontent.com/rauenzi/BDPluginLibrary/master/release/0PluginLibrary.plugin.js");
	                     
	                        await new Promise(r => require("fs").writeFile(require("path").join(ContentManager.pluginsFolder, "0PluginLibrary.plugin.js"), body, r));

	                        //remove remote lib
	                        setTimeout(_ => {
	                        	global.ZLibrary = undefined;
	                        }, 10000);
	                        
	                    });
	                }
	            }, props));
	        });
    	}
	}
	const compilePlugin = ([Plugin, Api]) => {
		const plugin = (Plugin, Api) => {
	const {PluginUtilities, DiscordModules} = Api;

	const SelectedChannelStore = DiscordModules.SelectedChannelStore;
	const ChannelStore = DiscordModules.ChannelStore;
	const Upload = BdApi.findModule(m => m.upload && typeof m.upload === 'function');


	const insertButtons = async (plugin, recreate=false) => {

		let element = document.querySelector('#audio-buttons');

		if(recreate){
			window.SendAudioUtil.removeDom(element);
			recreate = null;
		}

		if(!element){
			let local = document.querySelector('.buttons-3JBrkn');

			if(!local)
				return;

			element = document.createElement('div');

			element.id = 'audio-buttons';
			element.style.display = 'inherit';
			element.innerHTML = `
				<button role='record' alert-data='Record' alert-id='audio_buttons-record' alert-top='-14'>
					<span data-icon="ptt">
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
							<path d="M11.999 14.942c2.001 0 3.531-1.53 3.531-3.531V4.35c0-2.001-1.53-3.531-3.531-3.531S8.469 2.35 8.469 4.35v7.061c0 2.001 1.53 3.531 3.53 3.531zm6.238-3.53c0 3.531-2.942 6.002-6.237 6.002s-6.237-2.471-6.237-6.002H3.761c0 4.001 3.178 7.297 7.061 7.885v3.884h2.354v-3.884c3.884-.588 7.061-3.884 7.061-7.885h-2z"></path>
						</svg>
					</span>
				</button>
				<div role='recording' style='display: none'>
					<button role='delete' style='display: flex;' alert-data='Cancel' alert-id='audio_buttons-delete' alert-top='-14'>
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 475.2 475.2">
							<path d="M405.6,69.6C360.7,24.7,301.1,0,237.6,0s-123.1,24.7-168,69.6S0,174.1,0,237.6s24.7,123.1,69.6,168s104.5,69.6,168,69.6s123.1-24.7,168-69.6s69.6-104.5,69.6-168S450.5,114.5,405.6,69.6z M386.5,386.5c-39.8,39.8-92.7,61.7-148.9,61.7s-109.1-21.9-148.9-61.7c-82.1-82.1-82.1-215.7,0-297.8C128.5,48.9,181.4,27,237.6,27s109.1,21.9,148.9,61.7C468.6,170.8,468.6,304.4,386.5,386.5z"></path>
							<path d="M342.3,132.9c-5.3-5.3-13.8-5.3-19.1,0l-85.6,85.6L152,132.9c-5.3-5.3-13.8-5.3-19.1,0c-5.3,5.3-5.3,13.8,0,19.1l85.6,85.6l-85.6,85.6c-5.3,5.3-5.3,13.8,0,19.1c2.6,2.6,6.1,4,9.5,4s6.9-1.3,9.5-4l85.6-85.6l85.6,85.6c2.6,2.6,6.1,4,9.5,4c3.5,0,6.9-1.3,9.5-4c5.3-5.3,5.3-13.8,0-19.1l-85.4-85.6l85.6-85.6C347.6,146.7,347.6,138.2,342.3,132.9z"></path>
						</svg>
					</button>
					<div role='control' style='display: flex;' alert-data='Pause' alert-id='audio_buttons-control' alert-top='-8'>
						<button role='pause'>
							<svg aria-hidden="false" viewBox="0 0 24 24">
								<path fill="currentColor" d="M0,14 L4,14 L4,0 L0,0 L0,14 L0,14 Z M8,0 L8,14 L12,14 L12,0 L8,0 L8,0 Z" transform="translate(6 5)"></path>
							</svg>
						</button>
						<button role='resume' style='display: none'>
							<svg aria-hidden="false" viewBox="0 0 24 24">
								<polygon fill="currentColor" points="0 0 0 14 11 7" transform="translate(7 5)"></polygon>
							</svg>
					</button>
					</div>
					<button role='send' style='display: flex;' alert-data='${plugin.settings.preview ? 'Preview' : 'Send'}' alert-id='audio_buttons-send' alert-top='-14'>${plugin.settings.preview ? `
						<svg role='save' xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" enable-background="new 0 0 512 512" xml:space="preserve">
							<path d="M504.1,256C504.1,119,393,7.9,256,7.9C119,7.9,7.9,119,7.9,256C7.9,393,119,504.1,256,504.1C393,504.1,504.1,393,504.1,256z"></path>
							<path d="M392.6,172.9c-5.8-15.1-17.7-12.7-30.6-10.1c-7.7,1.6-42,11.6-96.1,68.8c-22.5,23.7-37.3,42.6-47.1,57c-6-7.3-12.8-15.2-20-22.3C176.7,244.2,152,229,151,228.4c-10.3-6.3-23.8-3.1-30.2,7.3c-6.3,10.3-3.1,23.8,7.2,30.2     c0.2,0.1,21.4,13.2,39.6,31.5c18.6,18.6,35.5,43.8,35.7,44.1c4.1,6.2,11,9.8,18.3,9.8c1.2,0,2.5-0.1,3.8-0.3c8.6-1.5,15.4-7.9,17.5-16.3c0.1-0.2,8.8-24.3,54.7-72.7c37-39.1,61.7-51.5,70.3-54.9c0.1,0,0.1,0,0.3,0c0,0,0.3-0.1,0.8-0.4c1.5-0.6,2.3-0.8,2.3-0.8c-0.4,0.1-0.6,0.1-0.6,0.1l0-0.1c4-1.7,11.4-4.9,11.5-5C393.3,196.1,397,184.1,392.6,172.9z"></path>
						</svg>` : `<svg role='send' version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 448 448"><polygon points="0.213,32 0,181.333 320,224 0,266.667 0.213,416 448,224"></polygon></svg>`}
					</button>
				</div>
			`;
			local.appendChild(element);
			try{

				document.querySelector('#audio-buttons button[role=record]').addEventListener('click', _ => {plugin.onRecordClick()});

				document.querySelector('#audio-buttons button[role=delete]').addEventListener('click', _ => {plugin.onDeleteClick()});
				document.querySelector('#audio-buttons button[role=send]').addEventListener('click', _ => {plugin.onSendClick()});

				document.querySelector('#audio-buttons button[role=pause]').addEventListener('click', _ => {plugin.onPauseClick()});
				document.querySelector('#audio-buttons button[role=resume]').addEventListener('click', _ => {plugin.onResumeClick()});

				const rec = document.querySelector('#audio-buttons div[role=recording]');

				//fix
				const layer = document.querySelector('.layer-3QrUeG');

				if(layer){
					layer.style.atransform = layer.style.transform;
					layer.style.transform = '';
				}
				window.SendAudioUtil.Alert.add('#audio-buttons button[role=record]');

				

				await window.SendAudioUtil.sleep(10);
					
				rec.style.adisplay = rec.style.display;
				rec.style.display  = 'flex';

				window.SendAudioUtil.Alert.add('#audio-buttons button[role=delete]');
				window.SendAudioUtil.Alert.add('#audio-buttons button[role=send]');
				window.SendAudioUtil.Alert.add('#audio-buttons div[role=control]');
				
				rec.style.display = rec.style.adisplay;

				if(layer)
					layer.style.transform = layer.style.atransform;
			}
			catch(err){
				console.error("%c[%s]:", "color: #0f62de;font-weight: bold;", plugin.getName(), err);
				insertButtons(plugin);
			}
			return true;
		}
		return false;
	};
	
	const setButtons = (plugin, recording=false) => {
		if(!document.getElementById('audio-buttons'))
			return false;

		try{
			document.querySelector('#audio-buttons button[role=pause]').style.display = 'flex';
			document.querySelector('#audio-buttons button[role=resume]').style.display = 'none';
			document.querySelector('#audio-buttons button[role=send]').disabled = false;

			if(recording){
				document.querySelector('#audio-buttons button[role=record]').style.display = 'none';
				document.querySelector('#audio-buttons div[role=recording]').style.display = 'flex';
			}
			else{
				document.querySelector('#audio-buttons button[role=record]').style.display = 'flex';
				document.querySelector('#audio-buttons div[role=recording]').style.display = 'none';
			}
			return true;
		}
		catch(err){
			console.error("%c[%s]:", "color: #0f62de;font-weight: bold;", plugin.getName(), err);
		}

		return false;
	};
	const sendAudio = (channel, blob) => {

		let date = new Date();

		date = new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString();

		return Upload.upload(channel, new File([blob], window.SendAudioUtil.randomKey(3) + '-'  + date.substr(0, 10) + '-' + date.substr(11, 8).replace(/:/g, '-') + '.ogg'), {content: '', tts: false});
	};

	const insertButtonsSend = (plugin) => {
		if(document.getElementById('audio-buttons-send'))
			return false;

		let local = document.querySelector('.buttons-3JBrkn');
		if(!local)
			return false;

		let element = document.createElement('div');
		element.id = 'audio-buttons-send';

		element.innerHTML = `
		<button role='delete' alert-data='Cancel' alert-id='audio-buttons_nsend' alert-top='-14'>
			<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 475.2 475.2"><path d="M405.6,69.6C360.7,24.7,301.1,0,237.6,0s-123.1,24.7-168,69.6S0,174.1,0,237.6s24.7,123.1,69.6,168s104.5,69.6,168,69.6s123.1-24.7,168-69.6s69.6-104.5,69.6-168S450.5,114.5,405.6,69.6z M386.5,386.5c-39.8,39.8-92.7,61.7-148.9,61.7s-109.1-21.9-148.9-61.7c-82.1-82.1-82.1-215.7,0-297.8C128.5,48.9,181.4,27,237.6,27s109.1,21.9,148.9,61.7C468.6,170.8,468.6,304.4,386.5,386.5z"></path><path d="M342.3,132.9c-5.3-5.3-13.8-5.3-19.1,0l-85.6,85.6L152,132.9c-5.3-5.3-13.8-5.3-19.1,0c-5.3,5.3-5.3,13.8,0,19.1l85.6,85.6l-85.6,85.6c-5.3,5.3-5.3,13.8,0,19.1c2.6,2.6,6.1,4,9.5,4s6.9-1.3,9.5-4l85.6-85.6l85.6,85.6c2.6,2.6,6.1,4,9.5,4c3.5,0,6.9-1.3,9.5-4c5.3-5.3,5.3-13.8,0-19.1l-85.4-85.6l85.6-85.6C347.6,146.7,347.6,138.2,342.3,132.9z"></path></svg>
		</button>
		<button role='send' alert-data='Send' alert-id='audio-buttons_send' alert-top='-14'>
			<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 448 448"><polygon points="0.213,32 0,181.333 320,224 0,266.667 0.213,416 448,224"></polygon></svg>
		</button>
		`;

		element = local.appendChild(element);

		if(element){
			document.querySelector('#audio-buttons-send button[role=delete]').addEventListener('click', _ => {plugin.onPreviewDelete()});
			document.querySelector('#audio-buttons-send button[role=send]').addEventListener('click', _ => {plugin.onPreviewSend()});

			window.SendAudioUtil.Alert.add('#audio-buttons-send button[role=delete]');
			window.SendAudioUtil.Alert.add('#audio-buttons-send button[role=send]');
		}
	};

	const removeButtonsSend = () => {
		window.SendAudioUtil.Alert.remove('audio-buttons_nsend');
		window.SendAudioUtil.Alert.remove('audio-buttons_send');
		const ab = document.querySelector('#audio-buttons');
		window.SendAudioUtil.removeDom(document.getElementById('audio-buttons-send'));

		if(ab)
			ab.style.display = 'inherit';
	};
	const removeAudioButtons = () => {
		window.SendAudioUtil.Alert.remove('audio_buttons-send');
		window.SendAudioUtil.Alert.remove('audio_buttons-delete');
		window.SendAudioUtil.Alert.remove('audio_buttons-record');
		window.SendAudioUtil.Alert.remove('audio_buttons-control');;
		window.SendAudioUtil.removeDom(document.getElementById('audio-buttons'));
	};

	const recordingInfoPanel = (plugin) => {
		if(document.getElementById('SendAudio-InfoPanel'))
			return;

		const type = ChannelStore.getChannel(SelectedChannelStore.getChannelId());

        const data = `Recording in ${window.SendAudioUtil.getChannelName(type)} (${window.SendAudioUtil.getGuildName(type)})`;
		if(window.SendAudioUtil.createPanel(`
		<div class='size14-e6ZScH title-eS5yk3 da-title' style='padding: 8px 10px;'>
			<div style='word-wrap:break-word; width:auto; display:inline;'><svg class="flash-record" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="#FF0000" d="M504.1,256C504.1,119,393,7.9,256,7.9C119,7.9,7.9,119,7.9,256C7.9,393,119,504.1,256,504.1C393,504.1,504.1,393,504.1,256z"></path></svg> ${data}</div>
			<div>
				<input type='text' value='00:00:00 - 0 KB' style='background: transparent; border: none; color: var(--header-primary);width: 100%;text-align: center;' readonly>
			</div>
		</div>
		`, 'SendAudio-InfoPanel')){
		    let dom = document.getElementById('SendAudio-InfoPanel');
		    if(dom){
		        dom.setAttribute('alert-id', 'alert-SendAudio-InfoPanel');
		        dom.setAttribute('alert-data', data);
		        
		        window.SendAudioUtil.Alert.add('#SendAudio-InfoPanel');

		        plugin.panelTime = dom.querySelector('input');
		    }
		    return true;
		}
		return false;
	};
	const removeRecordingInfoPanel = () => {
	    window.SendAudioUtil.Alert.remove('alert-SendAudio-InfoPanel');
	    window.SendAudioUtil.removeDom(document.getElementById('SendAudio-InfoPanel'));  
	};

	const setButtonsPauseResume = (state) => {
		const domPause = document.querySelector('#audio-buttons button[role=pause]');
		const domResume = document.querySelector('#audio-buttons button[role=resume]');

		if(domPause && domResume){
			//paused == true
			domPause.parentNode.setAttribute('alert-data', (state ? 'Resume' : 'Pause'));
			window.SendAudioUtil.Alert.setValue(domPause.parentNode.getAttribute('alert-id'), (state ? 'Resume' : 'Pause')); 
			if(state){
				domPause.style.display = 'none';
				domResume.style.display = 'flex';
			}
			else{
				domPause.style.display = 'flex';
				domResume.style.display = 'none';
			}
		}
	};
	
	return class SendPlugin extends Plugin{
		onStart(){
			if(!document.getElementById('css-' + this.getName())){
				PluginUtilities.addStyle('css-' + this.getName(),`
					#audio-buttons button, #audio-buttons-send button{background: transparent;margin: 7px 0;}
					#audio-buttons button svg, #audio-buttons-send svg{width: 24px;height: 24px;color: var(--interactive-normal);fill: var(--interactive-normal);transform: scale(1);}
					#audio-buttons button:hover svg, #audio-buttons-send button:hover svg{transform: scale(1.14);color: var(--interactive-active);fill: var(--interactive-active);}
					#audio-buttons button:disabled, #audio-buttons-send button:disabled{opacity: 0.3;cursor: not-allowed;}
					#audio-buttons button:disabled svg, #audio-buttons-send button:disabled svg{transform: none !important;}
					.flash-record{width: 14px;height: 14px;position: relative;top: 2px;margin: 0 2px;animation: flash linear 1s infinite;}
					@keyframes flash{0% {opacity: 1;}50% {opacity: .1;}100% {opacity: 1;}}
					#audio-buttons-send{display: inherit;align-items: center;}
					.emilay-player div[role=title]{font-weight: 600;color: var(--header-primary);line-height: 18px;overflow: hidden;text-overflow: ellipsis;white-space: nowrap;font-size: 14px;}
					.emilay-player div[role=header] > div, .emilay-player div[role=time] > div, .emilay-player div[role=buttons-time], .emilay-player div[role=buttons-time] > div, .emilay-player div[role=volume]{display: inline-flex;}
					.emilay-player div[role=close]{opacity: 0;float: right;}
					.emilay-player:hover div[role=close]{opacity: 1;color: var(--interactive-normal);cursor: pointer;}
					.emilay-player div[role=close]:hover{color: var(--interactive-active);}
					.emilay-player div[role=buttons-time] > div[role=buttons], div[role=volume] > div[role=button]{cursor: pointer;color: var(--interactive-normal);}
					.emilay-player div[role=volume] > div[role=button]{padding-left: 15px;z-index: 3;}
					.emilay-player div[role=buttons-time] > div[role=buttons]:hover, .emilay-player div[role=volume]:hover div[role=button]{color:var(--interactive-active);}
					.emilay-player div[role=buttons-time] > div[role=buttons] > div, .emilay-player div[role=volume] > div[role=button] > div[role=off]{display: none;}
					.emilay-player div[role=controller]{display: flow-root;color: var(--text-normal);}
					.emilay-player div[role=buttons-time] > div[role=buttons] > div[role=play], .emilay-player div[role=volume] > div[role=button] > div[role=on]{display: flex;}
					.emilay-player div[role=buttons-time] > div[role=time]{font-size: 13.3333px;align-items: center;}
					.emilay-player div[role=volume]{float: right;}
					.emilay-player div[role=time-bar]{cursor: pointer;background-color: rgba(185,187,190,.3);height: 5px;border-radius: 4px;}
					.emilay-player div[role=time-bar] > div[role=preview]{height: 100%;width: 0%;border-radius: 4px;background-color: var(--text-normal);opacity: .3;}
					.emilay-player div[role=time-bar] > div[role=current]{position: relative;top: -10px;width: 100%;height: 100%;}
					.emilay-player div[role=time-bar] > div[role=current] > div[role=bar]{height: 100%;width: 0%;border-radius: 4px;background-color: #7289da;display: inline-flex;float: left;transition: transform .1s cubic-bezier(0.4,0.0,1,1);}
					.emilay-player div[role=time-bar] > div[role=current] > div[role=circle]{background-color: #8ea1e1;width: 10px;height: 10px;display: none;float: left;border-radius: 50%;position: absolute;top: -3px;margin-left: -5px;}
					.emilay-player div[role=time-bar]:hover div[role=current] > div[role=circle]{display: inline;}
					.emilay-player div[role=volume] > div[role=range]{position: relative;top: -80px;left: -40px;cursor: pointer;display: none;}
					.emilay-player div[role=volume] > div[role=range] div[role=iback]{width: 12px;height: 100px;background: var(--background-tertiary);position: absolute;border-radius: 7px;}
					.emilay-player div[role=volume] > div[role=range] div[role=background]{background: rgba(185,187,190,.3);width: 70%;height: 95%;position: absolute;left: 15%;top: 2.5%;border-radius: 7px;}
					.emilay-player div[role=volume] > div[role=range] div[role=bar]{width: 100%;height: 100%;background: #7289da;position: absolute;bottom: 0;border-radius: 7px;}
					.emilay-player div[role=volume] > div[role=range] div[role=circle]{width: 10px;background: #8ea1e1;position: absolute;height: 10px;border-radius: 50%;left: -0.7px;}
					.emilay-player div[role=volume]:hover div[role=range]{display: flex;}
					.emilay-player div[role=time-bar] div[role=buff]{height: 100%;width: 0%;border-radius: 4px;background-color: var(--text-normal);opacity: .3;z-index: 0;position: relative;top: -5px;}
					.mini-alert{position: fixed;word-break: break-word; z-index: 1000;display:none;height: auto;}
					.mini-alert div:before{top: 100%;left: 50%;content: " ";width: 0;height: 0;margin-left: -5px;border: 5px solid transparent;border-top-color: #000;position: absolute;pointer-events: none;}
					.mini-alert div{position: absolute;border-radius: 3px;padding: 6px 8px;transform: translateX(-50%);line-height: 18px;text-align: center;font-weight: 600;font-size: 12px;color: #f6f6f7;transition: opacity .2s ease-out;background-color: #000;}

					#audio-buttons button[role=send] svg[role=save]{border: 1px solid rgb(50, 190, 166);border-radius: 590%;}
					
					#audio-buttons button[role=send] svg[role=save] path:first-child{fill: transparent;border: 1px solid rgb(50, 190, 166);}
					#audio-buttons button[role=send] svg[role=save] path:last-child{fill: rgb(50, 190, 166);}
					#audio-buttons button[role=delete] svg, #audio-buttons-send button[role=delete] svg{fill: #cc3d3d;fill-opacity: 100;transform: scale(1);}
					#audio-buttons button[role=delete]:hover svg, #audio-buttons-send button[role=delete]:hover svg{transform: scale(1.14);fill: red;}
					#audio-buttons-send button[role=send] svg, #audio-buttons button[role=send] svg[role=send]{fill: rgb(50, 190, 166);}
					
					#plugin-settings-SendAudio{padding: 20px;}
				`);
			}
			if(!document.getElementById('js-' + this.getName()))
				PluginUtilities.addScript('js-' + this.getName(), 'https://rawcdn.githack.com/MKSx/Send-Audio-Plugin-BetterDiscord/eb8d9206ec136372e56256ddefdfa18c094021aa/SendAudioUtil.js?v=' + this.getVersion());

			
			let plugin = this;

			setTimeout(_ => plugin.init(), 500);

		}
		init(){
			this.recorder = window.SendAudioUtil.RecorderAudio(this.settings.nitro ? 52428800 : 8388608);

			this.channel = false;

			this.player = false;
			this.confirmSend = false;

			this.saveAudio = false;

			this.panelTime = null;

			let plugin = this;

			this.recorder.on('start', _ => {
				plugin.channel = ChannelStore.getChannel(SelectedChannelStore.getChannelId());
			});

			this.recorder.on('time', data => {
				data.time = window.SendAudioUtil.convertToTime(data.seconds);

				if(plugin.panelTime)
					plugin.panelTime.value = `${data.time} - ${data.strSize}`;
			});

			this.recorder.on('stop', data => {
				removeRecordingInfoPanel();
				const audio_buttons = document.querySelector('#audio-buttons');

				if((plugin.saveAudio || data.limitStop) && data.valid && plugin.recorder.seconds() > 1){
					if(!plugin.settings.preview){
						if(data.limitStop){
							plugin.confirmSend = true;

							if(audio_buttons)
								audio_buttons.style.display = 'none';

							insertButtonsSend(plugin);
						}
						else{
							sendAudio(plugin.channel.id, plugin.recorder.blob());
							plugin.channel = null;
						}
					}
					else{
						plugin.player = window.SendAudioUtil.createPlayer('SendAudio-Player');

						plugin.player.setAudio(URL.createObjectURL(plugin.recorder.blob()), false);
						plugin.player.setTitle('Audio preview');

						plugin.player.on('close', _ => {
							plugin.player = false;
						});

						if(audio_buttons)
							audio_buttons.style.display = 'none';

						insertButtonsSend(plugin);
						plugin.confirmSend = true;
					}
				}
				plugin.saveAudio = false;
			});

			setTimeout(_ => plugin.onSwitch(), 500);
		}
		onStop(){

			if(this.recorder)
				this.recorder.stop();

			if(this.player)
				this.player.close();

			removeAudioButtons();
			removeButtonsSend();
			removeRecordingInfoPanel();

			PluginUtilities.removeStyle('css-' + this.getName());
			PluginUtilities.removeScript('js-' + this.getName());
		}
		async onSwitch(){
			let uploadButton = document.getElementsByClassName('attachButton-2WznTc');
			let channel = ChannelStore.getChannel(SelectedChannelStore.getChannelId());

			if(!channel || !uploadButton || uploadButton[0] == undefined)
				return;

			insertButtons(this);

			if(!(this.recorder && this.recorder.media() && this.recorder.media().state != 'inactive'))
				setButtons(this, false);
			else{
				await setButtons(this, true);

				setButtonsPauseResume(this.recorder.media().state == 'paused');

				if(this.channel && this.channel.id != channel.id){
					uploadButton = document.querySelector('#audio-buttons button[role=send]');
					if(uploadButton)
						uploadButton.disabled = true;
				}
			}

			if(this.confirmSend){

				insertButtonsSend(this);

				uploadButton = document.querySelector('#audio-buttons');
				if(uploadButton)
					uploadButton.style.display = 'none';
				
				if(this.channel && this.channel.id != channel.id){
					uploadButton = document.querySelector('#audio-buttons-send button[role=send]');
					if(uploadButton)
						uploadButton.disabled = true;
				}
			}
		}
		getSettingsPanel(){
			const settings = this.buildSettingsPanel();
			if(settings){
				let plugin = this;
				settings.addListener((id, value) => {
					if(id == 'preview'){
						const audio_butons_send = document.querySelector('#audio-buttons button[role=send]');
						if(audio_butons_send){
							if(value == true){
								audio_butons_send.setAttribute('alert-data', 'Preview');
								window.SendAudioUtil.Alert.setValue(audio_butons_send.getAttribute('alert-id'), 'Preview');
								audio_butons_send.innerHTML = `
									<svg role='save' xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" enable-background="new 0 0 512 512" xml:space="preserve">
										<path d="M504.1,256C504.1,119,393,7.9,256,7.9C119,7.9,7.9,119,7.9,256C7.9,393,119,504.1,256,504.1C393,504.1,504.1,393,504.1,256z"></path>
										<path d="M392.6,172.9c-5.8-15.1-17.7-12.7-30.6-10.1c-7.7,1.6-42,11.6-96.1,68.8c-22.5,23.7-37.3,42.6-47.1,57c-6-7.3-12.8-15.2-20-22.3C176.7,244.2,152,229,151,228.4c-10.3-6.3-23.8-3.1-30.2,7.3c-6.3,10.3-3.1,23.8,7.2,30.2     c0.2,0.1,21.4,13.2,39.6,31.5c18.6,18.6,35.5,43.8,35.7,44.1c4.1,6.2,11,9.8,18.3,9.8c1.2,0,2.5-0.1,3.8-0.3c8.6-1.5,15.4-7.9,17.5-16.3c0.1-0.2,8.8-24.3,54.7-72.7c37-39.1,61.7-51.5,70.3-54.9c0.1,0,0.1,0,0.3,0c0,0,0.3-0.1,0.8-0.4c1.5-0.6,2.3-0.8,2.3-0.8c-0.4,0.1-0.6,0.1-0.6,0.1l0-0.1c4-1.7,11.4-4.9,11.5-5C393.3,196.1,397,184.1,392.6,172.9z"></path>
									</svg>
								`;
							}
							else{
								audio_butons_send.setAttribute('alert-data', 'Send');
								window.SendAudioUtil.Alert.setValue(audio_butons_send.getAttribute('alert-id'), 'Send');
								audio_butons_send.innerHTML = `<svg role='send' version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 448 448"><polygon points="0.213,32 0,181.333 320,224 0,266.667 0.213,416 448,224"></polygon></svg>`;

							}
						}
					}
					else if(id == 'nitro')
						plugin.recorder.limit.setSize(value ? 52428800 : 8388608);
				});
            	return settings.getElement();
			}
		}
		onRecordClick(){
			setButtons(this, true);
			setButtonsPauseResume(false);

			recordingInfoPanel(this);

			this.recorder.start();
		}
		onDeleteClick(){
			setButtons(this, false);
			this.recorder.stop();
		}

		onSendClick(){
			setButtons(this, false);
			this.saveAudio = true;
			this.recorder.stop();
		}
		onPreviewSend(){
			this.confirmSend = false;
			removeButtonsSend();
			sendAudio(this.channel.id, this.recorder.blob());

			if(this.player)
				this.player.close();

			const audio_buttons = document.querySelector('#audio-buttons');

			if(audio_buttons)
				audio_buttons.style.display = 'inherit';

			this.recorder.reset();

			setButtons(this, false);
		}
		onPreviewDelete(){
			if(this.player)
				this.player.close();

			this.confirmSend = false;

			removeButtonsSend();

			const audio_buttons = document.querySelector('#audio-buttons');

			if(audio_buttons)
				audio_buttons.style.display = 'inherit';

			setButtons(this, false);
			this.recorder.reset();
		}
		onPauseClick(){
			setButtonsPauseResume(true);
			this.recorder.pause();
		}
		onResumeClick(){
			setButtonsPauseResume(false);
			this.recorder.resume();
		}
	};
};
		return plugin(Plugin, Api);
	};
	if(!global.ZLibrary && typeof global.ZeresPluginLibrary != 'function'){
		return class {
			getName() {return config.info.name.replace(" ", "");} getAuthor() {return config.info.authors.map(a => a.name).join(", ");} getDescription() {return config.info.description;} getVersion() {return config.info.version;} stop() {}
			showAlert() {window.BdApi.alert("Loading Error",`Something went wrong trying to load the library for the plugin. You can try using a local copy of the library to fix this.<br /><br /><a href="https://betterdiscord.net/ghdl?url=https://raw.githubusercontent.com/rauenzi/BDPluginLibrary/master/release/0PluginLibrary.plugin.js" target="_blank">Click here to download the library!</a>`);}
			async load() {
				try {await global.ZLibraryPromise;}
				catch(err) {return this.showAlert();}
				const vm = require("vm"), plugin = compilePlugin(global.ZLibrary.buildPlugin(config));
				try {new vm.Script(plugin, {displayErrors: true});} catch(err) {return bdpluginErrors.push({name: this.getName(), file: this.getName() + ".plugin.js", reason: "Plugin could not be compiled.", error: {message: err.message, stack: err.stack}});}
				global[this.getName()] = plugin;
				try {new vm.Script(`new global["${this.getName()}"]();`, {displayErrors: true});} catch(err) {return bdpluginErrors.push({name: this.getName(), file: this.getName() + ".plugin.js", reason: "Plugin could not be constructed", error: {message: err.message, stack: err.stack}});}
				bdplugins[this.getName()].plugin = new global[this.getName()]();
				bdplugins[this.getName()].plugin.load();
			}
			async start() {
				try {await global.ZLibraryPromise;}
				catch(err) {return this.showAlert();}
				bdplugins[this.getName()].plugin.start();
			}
		};
	}
	//Loading plugin using remote lib or local lib
	return typeof global.ZeresPluginLibrary != 'function' ? compilePlugin(global.ZLibrary.buildPlugin(config)) : compilePlugin(global.ZeresPluginLibrary.buildPlugin(config));
})();
/*@end@*/
