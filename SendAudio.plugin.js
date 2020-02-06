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
	const config = {"info":{"name":"Send Audio","authors":[{"name":"Matues","discord_id":"301016626579505162","github_username":"MKSx"}],"version":"1.1.2","description":"Record and send audios in chat","github":"https://github.com/MKSx/EnviarAudio-BetterDiscord","github_raw":"https://raw.githubusercontent.com/MKSx/Send-Audio-Plugin-BetterDiscord/master/SendAudio.plugin.js"},"main":"index.js","defaultConfig":[{"type":"switch","name":"Preview the audio before sending","id":"preview","value":true},{"type":"switch","name":"Increases the audio size limit from 8 MB to 50 MB (if you are a nitro user)","id":"nitro","value":false}],"changelog":[{"title":"Bugs Fixed", "type":"fixed","items":["Design bug"]}]};

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

	const SendAudioUtil = {
		//https://stackoverflow.com/questions/951021/what-is-the-javascript-version-of-sleep/39914235#39914235
		sleep: async (ms) => new Promise(resolve => setTimeout(resolve, ms)),
		randomInt: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min,
		randomKey: (len) => {
			if(len < 1)
				return '';

			let ret = '';
			for(let i = 0, j = parseInt(len / 3) + (len % 3); i < j; ++i)
				ret = ret + String.fromCharCode(SendAudioUtil.randomInt(65, 90)) + String.fromCharCode(SendAudioUtil.randomInt(48, 57)) + String.fromCharCode(SendAudioUtil.randomInt(97, 122));

			return ret.slice(0, len);
		},
		removeDom: (dom) => {
			if(dom && typeof(dom) == 'object' && typeof(dom.parentNode) == 'object' && typeof(dom.parentNode.removeChild) == 'function'){
				dom.parentNode.removeChild(dom);
				return true;
			}
			return false;
		},
		createPanel: (html, id) => {
			let dom = document.querySelector('.panels-j1Uci_');

			if(!dom)
				return false;

			let element = document.createElement('div');
			element.className = 'panel-24C3ux da-panel activityPanel-28dQGo da-activityPanel';
			element.id = id;
			element.style.display = 'flex';
			element.innerHTML = html;


			dom.insertBefore(element, dom.firstChild);
			return true;	
		},
		removePanel: (id) => SendAudioUtil.removeDom(document.getElementById(id)),
		convertToTime: (seconds) => {
		    seconds = parseInt(seconds);
		    return typeof seconds == 'number' && seconds > -1 ? new Date(parseInt(seconds) * 1000).toISOString().substr(11, 8) : '00:00:00';
		},
		getChannelName: (type) => {
			if(type.isGroupDM() || type.isDM()){
				let dom = document.querySelector('.selected-aXhQR6');
				if(dom){
					dom = dom.innerText.split('\n');
					if(dom.length > 1){
						return (type.isDM() ? '@' : '') + dom[1];
					}
				}
			}
			else{
				let dom = document.querySelector('.name-3_Dsmg');
				if(dom)
					return '#' + dom.innerText;
			}
			return 'Unknown channel';
		},
		getGuildName: (type) => {
			if(type.isGroupDM()){
				return 'Group';
			}
			else if(type.isDM()){
				return "DM";
			}
			else{
				type = document.querySelector('.name-3YKhmS');
				if(type){
					return type.innerText;
				}

			}
			return 'Unknown server';
		},
		createPlayer: (id) => {
			if(SendAudioUtil.createPanel(`
			<div class='emilay-player' style='width: 100%'>
				<div role='header'>
					<div role='title'></div>
					<div role='close'>
						<svg class="closeIcon-rycxaQ da-closeIcon" aria-hidden="false" width="16" height="16" viewBox="0 0 24 24">
							<path fill="currentColor" d="M18.4 4L12 10.4L5.6 4L4 5.6L10.4 12L4 18.4L5.6 20L12 13.6L18.4 20L20 18.4L13.6 12L20 5.6L18.4 4Z"></path>
						</svg>
					</div>
				</div>
				<div role='controller' style='margin: 10px 0;'>
					<div role='buttons-time'>
						<div role='buttons'>
							<div role='play'>
								<svg aria-hidden="false" width="24" height="24" viewBox="0 0 24 24">
					            	<polygon fill="currentColor" points="0 0 0 14 11 7" transform="translate(7 5)"></polygon>
					        	</svg>
							</div>
							<div role='pause'>
								<svg aria-hidden="false" width="24" height="24" viewBox="0 0 24 24">
									<path fill="currentColor" d="M0,14 L4,14 L4,0 L0,0 L0,14 L0,14 Z M8,0 L8,14 L12,14 L12,0 L8,0 L8,0 Z" transform="translate(6 5)"></path>
								</svg>
							</div>
							<div role='replay'>
								<svg aria-hidden="false" width="24" height="24" viewBox="0 0 24 24">
									<path fill="currentColor" d="M12,5 L12,1 L7,6 L12,11 L12,7 C15.31,7 18,9.69 18,13 C18,16.31 15.31,19 12,19 C8.69,19 6,16.31 6,13 L4,13 C4,17.42 7.58,21 12,21 C16.42,21 20,17.42 20,13 C20,8.58 16.42,5 12,5 L12,5 Z"></path>
								</svg>
							</div>
						</div>
						<div role='time'><div role='current'>--:--</div>/<div role='duration'>--:--</div></div>
					</div>
					<div role='volume' value='1'>
						<div role='button'>
							<div role='on'>
								<svg aria-hidden="false" width="24" height="24" viewBox="0 0 24 24">
									<path fill="currentColor" fill-rule="evenodd" clip-rule="evenodd" d="M11.383 3.07904C11.009 2.92504 10.579 3.01004 10.293 3.29604L6 8.00204H3C2.45 8.00204 2 8.45304 2 9.00204V15.002C2 15.552 2.45 16.002 3 16.002H6L10.293 20.71C10.579 20.996 11.009 21.082 11.383 20.927C11.757 20.772 12 20.407 12 20.002V4.00204C12 3.59904 11.757 3.23204 11.383 3.07904ZM14 5.00195V7.00195C16.757 7.00195 19 9.24595 19 12.002C19 14.759 16.757 17.002 14 17.002V19.002C17.86 19.002 21 15.863 21 12.002C21 8.14295 17.86 5.00195 14 5.00195ZM14 9.00195C15.654 9.00195 17 10.349 17 12.002C17 13.657 15.654 15.002 14 15.002V13.002C14.551 13.002 15 12.553 15 12.002C15 11.451 14.551 11.002 14 11.002V9.00195Z"></path>
								</svg>
							</div>
							<div role='off'>
								<svg aria-hidden="false" width="24" height="24" viewBox="0 0 24 24">
									<path fill="currentColor" d="M13.5,9 C13.5,7.23 12.48,5.71 11,4.97 L11,7.18 L13.45,9.63 C13.48,9.43 13.5,9.22 13.5,9 L13.5,9 Z M16,9 C16,9.94 15.8,10.82 15.46,11.64 L16.97,13.15 C17.63,11.91 18,10.5 18,9 C18,4.72 15.01,1.14 11,0.23 L11,2.29 C13.89,3.15 16,5.83 16,9 L16,9 Z M1.27,0 L0,1.27 L4.73,6 L0,6 L0,12 L4,12 L9,17 L9,10.27 L13.25,14.52 C12.58,15.04 11.83,15.45 11,15.7 L11,17.76 C12.38,17.45 13.63,16.81 14.69,15.95 L16.73,18 L18,16.73 L9,7.73 L1.27,0 L1.27,0 Z M9,1 L6.91,3.09 L9,5.18 L9,1 L9,1 Z" transform="translate(3 3)"></path>
								</svg>
							</div>
						</div>
						<div role='range'>
							<div role='protect' style="width: 50px;background: #3e4146;position: absolute;left: -20px;height: 115px;top: -15px;z-index: 0;opacity: .3;"></div>
							<div role='iback' style='top: -5px;z-index: 3;'>
								<div role='background'>
									<div role='bar'>
										<div role='circle'></div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
				<div role='time-bar' alert-data='00:00:00' alert-id='alert-${id}-preview' alert-top='-5'>
					<div role='preview'></div>
					<div role='buff'></div>
					<div role='current'><div role='bar'></div><div role='circle'></div></div>
				</div>
			</div>
		`, id)){
				const time_bar = document.querySelector(`#${id} div[role=time-bar]`);
				const bar_preview = document.querySelector(`#${id} div[role=time-bar] div[role=preview]`);

				SendAudioUtil.Alert.add(`#${id} div[role=time-bar]`);



				const bar_time_preview = document.querySelector(`#alert-${id}-preview`);

				const playBtn = document.querySelector(`#${id} div[role=buttons-time] div[role=buttons] div[role=play]`);
				const pauseBtn = document.querySelector(`#${id} div[role=buttons-time] div[role=buttons] div[role=pause]`);

				const replayBtn = document.querySelector(`#${id} div[role=buttons-time] div[role=buttons] div[role=replay]`);

				const primaryButtons = (play, pause, replay) => {
					playBtn.style.display = play;
					pauseBtn.style.display = pause;
					replayBtn.style.display = replay;
				};

				const isAudio = (obj) => obj && typeof obj == 'object' && typeof obj.play == 'function' && typeof obj.pause == 'function' && typeof obj.addEventListener == 'function';

				const primaryButton = document.querySelector(`#${id} div[role=buttons-time] div[role=buttons]`);

				const current_bar = document.querySelector(`#${id} div[role=time-bar] div[role=current] div[role=bar]`);
				
				const current_time = document.querySelector(`#${id} div[role=controller] div[role=buttons-time] div[role=time] div[role=current]`);
				const audio_duration = document.querySelector(`#${id} div[role=controller] div[role=buttons-time] div[role=time] div[role=duration]`);

				const volume_bar = document.querySelector(`#${id} div[role=volume] div[role=range] div[role=bar]`);

				const volumeOnBtn = document.querySelector(`#${id} div[role=volume] div[role=button] div[role=on]`);

				const volumeOffBtn = document.querySelector(`#${id} div[role=volume] div[role=button] div[role=off]`);

				const div_volume = document.querySelector(`#${id} div[role=volume] div[role=range] div[role=iback]`);
				
				const dtitle = document.querySelector(`#${id} div[role=header] div[role=title]`);

				const closeBtn = document.querySelector(`#${id} div[role=header] div[role=close]`);

				const buff_bar = document.querySelector(`#${id} div[role=time-bar] div[role=buff]`);

				const volume_circle = document.querySelector(`#${id} div[role=volume] > div[role=range] div[role=circle]`);


				document.querySelector(`#${id} div[role=volume] div[role=range]`).style.display = 'flex'

				const volume_circle_height = volume_circle.offsetHeight;	
				const volume_base_height = 	document.querySelector(`.emilay-player div[role=volume] > div[role=range] div[role=background]`).offsetHeight;

				document.querySelector(`#${id} div[role=volume] div[role=range]`).style.display = '';

				let value = 0;

				let internal_audio = false;

				let time_update = false;

				let paused = false;

				let volume_update = false;

				let last_volume = 0;

				let default_volume = 1;

				let events = {
					close: false,
					ended: false
				};

				const CalcVolumeHeight = (baseHeight, circleHeight, per) => (per = parseFloat(per) * (baseHeight / 100)) > (baseHeight - circleHeight) ? (`${per - circleHeight}px`) : ((per - (circleHeight / 2) < 0 ? `${per}px` : `${per - (circleHeight / 2)}px`));

				const closePlayer = () => {
					if(internal_audio){
						volume_update = false;
						time_update = false;
						internal_audio.pause();
						internal_audio = false;
					}
					SendAudioUtil.removePanel(id);
					SendAudioUtil.Alert.remove(`alert-${id}-preview`);

					if(typeof events.close == 'function')
						events.close();
				};
				closeBtn.addEventListener('click', closePlayer);

				primaryButton.addEventListener('click', _ => {
					if(internal_audio){
						if(internal_audio.ended){
							internal_audio.currentTime = 0;
							internal_audio.play();
						}
						else if(internal_audio.paused)
							internal_audio.play();
						else
							internal_audio.pause();
					}
				});

				const updateTime = (seconds) => {
					if(!paused){
						internal_audio.play().then(_ => {
							internal_audio.currentTime = seconds;
						}).catch(error => {
							console.log(error);
						});
					}
					else{
						internal_audio.currentTime = seconds;
					}
				};

				const updateVolume = (value) => internal_audio.volume = ((value = (parseFloat(value) * (1 / 100))) < 0 ? 0 : (value > 1 ? 1 : value));

				const updateVolumeBar = (volume) => {
					volume_bar.style.height = `${volume / (1 / 100)}%`;
					volume_circle.style.bottom = CalcVolumeHeight(volume_base_height, volume_circle_height, volume / (1 / 100));

					if(volume == 0){
						volumeOnBtn.style.display = 'none';
						volumeOffBtn.style.display = 'flex';
					}
					else{
						volumeOnBtn.style.display = 'flex';
						volumeOffBtn.style.display = 'none';
					}
				};
				const updateTimeBar = (e, moving=false) => {
					value = ((e.pageX - time_bar.offset().x) / time_bar.offset().width) * 100;
					value = (value < 0 ? 0 : (value > 100 ? 100 : value));

					bar_preview.style.width = `${value}%`;


					if(internal_audio){
						SendAudioUtil.Alert.setPos('left', bar_time_preview, time_bar, value, true);

						bar_time_preview.firstElementChild.innerHTML = SendAudioUtil.convertToTime(value * (internal_audio.duration / 100));
						
						if(!moving){
							if((paused = internal_audio.paused || internal_audio.ended))
								primaryButtons('flex', 'none', 'none');

							internal_audio.pause();

							updateTime(value * (internal_audio.duration / 100));
						}
						else{
							if(!time_update)
								return false;

							current_bar.style.width = `${value}%`;
							current_time.innerHTML = bar_time_preview.firstElementChild.innerHTML;
						}
					}
				};
				time_bar.addEventListener('mousemove', (e) => updateTimeBar(e, true));
				time_bar.addEventListener('click', (e) => updateTimeBar(e));

				time_bar.addEventListener('mouseleave', _ => {
					bar_preview.style.width = '0%';

					if(internal_audio && time_update){
						updateTime(parseInt(current_bar.style.width) * (internal_audio.duration / 100));
						time_update = false;	
					}
				});

				time_bar.addEventListener('mousedown', _ => {
					if(internal_audio){
						if((paused = internal_audio.paused || internal_audio.ended))
							primaryButtons('flex', 'none', 'none');

						internal_audio.pause();

						time_update = true;
					}
				});
				time_bar.addEventListener('mouseup', _ => {
					if(internal_audio && time_update){
						updateTime(parseInt(current_bar.style.width) * (internal_audio.duration / 100));
						time_update = false;	
					}
				});

				const updateVolumeMove = (e, moving=false) => {
					

					if(internal_audio){

						if(moving){
							if(!volume_update)
								return;
						}

						value = (div_volume.offset().y + 100) - e.pageY;
						value = (value > 100 ? 100 : (value < 7 ? 0 : value));

						volume_bar.style.height = `${value}%`;
						volume_circle.style.bottom = CalcVolumeHeight(volume_base_height, volume_circle_height, value);

						updateVolume(value);
					}
				};

				div_volume.addEventListener('click', updateVolumeMove);

				div_volume.addEventListener('mousemove', (e) => updateVolumeMove(e, true));

				const updateVolumeOut  = () => {
					if(internal_audio && volume_update){
						volume_update = false;
						updateVolume(volume_bar.style.height);
					}
				};
				div_volume.addEventListener('mousedown', _ => {
					if(internal_audio){
						volume_update = true;
					}
				});
				div_volume.addEventListener('mouseup', updateVolumeOut);
				div_volume.addEventListener('mouseleave', updateVolumeOut);

				volumeOnBtn.parentNode.addEventListener('click', _ => {
					if(internal_audio){
						if(internal_audio.volume == 0)
							internal_audio.volume = (last_volume == 0 ? 1 : last_volume);
						else{
							last_volume = internal_audio.volume;
							internal_audio.volume = 0;
						}
					}
				});

				return {
					setAudio: async (a, force=false) => {
						if(typeof a == 'string')
							a = new Audio(a);
						else if(typeof a != 'object' || a.HAVE_CURRENT_DATA == undefined)
							return false;
						
						

						if(isAudio(internal_audio))
							internal_audio.pause();

						internal_audio = false;

						//sleep
						await SendAudioUtil.sleep(500);

						if(!isAudio(a) || a.error != null){
							return false;
						}
						internal_audio = a;

						let force_call = force || isNaN(a.duration) || a.duration != Infinity || a.readyState > 0;

						const loadedMetaData = async () => {
							/*
							Fix audio duration:
							https://stackoverflow.com/questions/21522036/html-audio-tag-duration-always-infinity/52375280#52375280
							*/
							while(internal_audio.duration == Infinity){
								await SendAudioUtil.sleep(1000);
								internal_audio.currentTime = 10000000 * Math.random();
							}
						
							internal_audio.currentTime = 0;

							current_time.innerHTML = '00:00';

							SendAudioUtil.Alert.setPos('left', bar_time_preview, time_bar, 0, false);

							internal_audio.volume = default_volume;

							audio_duration.innerHTML = SendAudioUtil.convertToTime(internal_audio.duration);

							updateVolumeBar(internal_audio.volume);

							if(internal_audio.buffered)
								buff_bar.style.width = `${(internal_audio.buffered.end(0) / internal_audio.duration) * 100}%`
							else
								buff_bar.style.width = '0%';

							internal_audio.addEventListener('ended', _ => {
								primaryButtons('none', 'none', 'flex');

								if(typeof events.ended == 'function')
									events.ended();
							});
							internal_audio.addEventListener('pause', () => {
								primaryButtons('flex', 'none', 'none');
							});
							internal_audio.addEventListener('play', () => {
								primaryButtons('none', 'flex', 'none');
							});

							internal_audio.addEventListener('timeupdate', _ => {
								current_time.innerHTML = SendAudioUtil.convertToTime(internal_audio.currentTime);

								current_bar.style.width = `${internal_audio.currentTime * (100 / internal_audio.duration)}%`;
							});

							internal_audio.addEventListener('volumechange', _ => updateVolumeBar(internal_audio.volume));


							internal_audio.addEventListener('progress', _ => buff_bar.style.width = `${(internal_audio.buffered.end(0) / internal_audio.duration) * 100}%`);
						};
						if(!force_call)
							internal_audio.addEventListener('loadedmetadata', loadedMetaData);
						else
							setTimeout(loadedMetaData, 100);
					},
					stopAudio: () => {
						if(internal_audio){
							internal_audio.pause();
						}
						return true;
					},
					removeAudio: () => {
						if(internal_audio){
							internal_audio.pause();
						}
						current_time.innerHTML = '00:00';
						current_bar.style.width = '0%';
						audio_duration.innerHTML = '--:--';
						primaryButtons('flex', 'none', 'none');
					},
					defaultVolume: (vol) => default_volume = vol,
					getAudio: () => internal_audio,
					setTitle: (title) => dtitle.innerHTML = title,
					close: () => closePlayer(),
					on: (e, c) => {
						if(e in events)
							events[e] = c;
					}
				};
			}
			return false;
		},
		convertData: (size) => {
			//MB
			if(size >= 1048576){
				temp = (size / 1024) % 1024;

				return `${parseInt((size / 1024) / 1024)}${temp != 0 ? ('.' + temp).slice(0, 3) : ''} MB`;
			}
			temp = size % 1024;
			return `${parseInt(size / 1024)}${temp != 0 ? ('.' + temp).slice(0,3) : ''} KB`;
		},
		RecorderAudio: (UPLOAD_LIMIT_SIZE=8388608, TIME_LIMIT=0) => {
			let media, audioChunks = [], blobAudio, events = {
				'stop': null,
				'start': null,
				'time': null,
				'resume': null,
				'pause': null,
				'reset': null
			}, seconds = 0, audioSize = 0, temp, resetEvent = false, limitStop = false;

			let upload_size = UPLOAD_LIMIT_SIZE;
			let upload_time = TIME_LIMIT;

			navigator.mediaDevices.getUserMedia({audio: true}).then(stream => {
				media = new MediaRecorder(stream);

				media.addEventListener('dataavailable', e => {
					seconds++;

					if(e.data.size > 0){
						if(audioSize + e.data.size > upload_size || (upload_time > 0 && seconds > upload_time)){
							if(media.state != 'inactive'){
								limitStop = true;

								media.stop();
							}
							return;
						}
						audioChunks.push(e.data);
					}
					audioSize += e.data.size;

					if(typeof events.time == 'function')
						events.time({seconds: seconds, size: audioSize, strSize: SendAudioUtil.convertData(audioSize)});
				});

				media.addEventListener('stop', _ => {
					if(resetEvent){
						if(typeof events.reset == 'function')
							events.reset();

						resetEvent = false;
						return;
					}
					temp = false;

					if(audioSize > 0){

						if(upload_size > 0 && audioSize > upload_size){
							let tempChunks = [];
							let tempSize = 0;

							for(let i = 0; i < audioChunks.length; ++i){
								if(tempSize + audioChunks[i].size <= upload_size){
									tempChunks.push(audioChunks[i]);
									tempSize += audioChunks[i].size;
								}
							}
							audioChunks = tempChunks;
						}

						temp = true;
						blobAudio = new Blob(audioChunks, {type: 'audio/ogg'});
					}
					if(typeof events.stop == 'function'){
						events.stop({valid: temp, limitStop: limitStop});
						limitStop = false;
					}
				});

				media.addEventListener('start', _ => {

					seconds = 0;
					audioSize = 0;
					audioChunks = [];

					if(typeof events.start == 'function')
						events.start();
				});
				media.addEventListener('resume', _ => {
					if(typeof events.resume == 'function')
						events.resume();
				});
				media.addEventListener('pause', _ => {
					if(typeof events.pause == 'function')
						events.pause();
				});
			});
			return {
				on: (e, c) => {
					if(e in events)
						events[e] = c;
				},
				start: () => {
					if(!media)
						return false;
					
					if(media.state == 'inactive')
						media.start(1000);

					return media.state == 'recording';
				},
				stop: () => {
				
					if(!media)
						return false;

					if(media.state != 'inactive')
						media.stop();

					return media.state == 'inactive';
				},
				pause: () => {
					if(!media)
						return false;

					if(media.state == 'recording'){
						media.pause();
					}
					return media.state == 'paused';
				},
				resume: () => {
					if(!media)
						return false;

					if(media && media.state == 'paused'){
						media.resume();
					}
					return media.state == 'recording';
				},
				reset: () => {
				    if(!media)
				        return false;

					if(media.state != 'inactive'){
						resetEvent = true;
						media.stop();
					}

					audioChunks = [];
					seconds = 0;
					audioSize = 0;
					blobAudio = null;
					return true;
				},
				blob: () => blobAudio,
				seconds: () => seconds,
				media: () => media,
				size: () => audioSize,
				strSize: () => SendAudioUtil.convertData(audioSize),
				audioChunks: () => audioChunks,
				limit: {
					getSize: () => upload_size,
					setSize: (size) => upload_size = size,
					setTime: (time) => upload_time = time,
					getTime: () => upload_time
				}
			};
		},
		Alert: {
			events: {},
			add: (id) => {
				let dom = document.querySelector(id);

				if(!dom)
					return false;

				let alert_id = dom.getAttribute('alert-id');

				let alert_data = dom.getAttribute('alert-data');

				if(typeof alert_id != 'string' || typeof alert_data != 'string')
					return false;

				SendAudioUtil.Alert.remove(alert_id);


				let alert_ = document.getElementById(alert_id);

				if(!alert_){
					alert_ = document.querySelector('div[class="app-2rEoOp da-app"]').appendChild(document.createElement('div'));
					alert_.id = alert_id;
				}

				alert_.innerHTML = `<div>${alert_data}</div>`;
				alert_.className = 'mini-alert';

				alert_data = dom.getAttribute('alert-width');

				alert_.style.width = (alert_data ? alert_data : '100px');

				alert_.style.display  = 'block';

				dom.display = 'block';
				alert_data = dom.getAttribute('alert-top');
				alert_.style.top = `${dom.offset().y - alert_.firstElementChild.offsetHeight + (alert_data ? parseFloat(alert_data) : 0)}px`;

				alert_data = dom.getAttribute('alert-left');
				alert_.style.left = `${dom.offset().x + (dom.offset().width / 2) + (alert_data ? parseFloat(alert_data) : 0)}px`;
				
				alert_.style.display = 'none';

				SendAudioUtil.Alert.events[alert_id] = {
					dom: dom,
					over: () => alert_.style.display = 'block',
					out: () => alert_.style.display = 'none'
				};
				dom.addEventListener('mouseover', SendAudioUtil.Alert.events[alert_id].over);
				dom.addEventListener('mouseout', SendAudioUtil.Alert.events[alert_id].out);
				return alert_;
			},
			getId: (id) => {
				if(!(id in SendAudioUtil.Alert.events)){
					id = document.querySelector(id);
					if(!id)
						return false;

					id = id.getAttribute('alert-id');
				}
				if(id in SendAudioUtil.Alert.events)
					return id;

				return false;
			},
			remove: (id) => {

				id = SendAudioUtil.Alert.getId(id);

				if(id != false){
					if(SendAudioUtil.Alert.events[id].dom){
						SendAudioUtil.Alert.events[id].dom.removeEventListener('mouseover', SendAudioUtil.Alert.events[id].over);
						SendAudioUtil.Alert.events[id].dom.removeEventListener('mouseout', SendAudioUtil.Alert.events[id].out);

						SendAudioUtil.removeDom(document.getElementById(id));
					}

					delete SendAudioUtil.Alert.events[id];
				}
			},
			removeAll: () => {
				for(let key in SendAudioUtil.Alert.event){
					if(SendAudioUtil.Alert.events[key].dom){
						SendAudioUtil.Alert.events[key].dom.removeEventListener('mouseover', SendAudioUtil.Alert.events[key].over);
						SendAudioUtil.Alert.events[key].dom.removeEventListener('mouseout', SendAudioUtil.Alert.events[key].out);

						SendAudioUtil.removeDom(document.getElementById(key));
					}
				}
				SendAudioUtil.Alert.event = {};
			},
			setPos: (pos, alert, dom, value, percentage=false) => {
				if(alert && dom){
					if(pos == 'top'){
						if(!percentage)
							alert.style.top = `${dom.offset().y + parseFloat(value)}px`;
						else
							alert.style.top = `${dom.offset().y + ((dom.offsetHeight / 100) * parseFloat(value))}px`;
					}
					else if(pos == 'left'){
						if(!percentage)
							alert.style.left = `${dom.offset().x + parseFloat(value)}px`;
						else
							alert.style.left = `${dom.offset().x + ((dom.offsetWidth / 100) * parseFloat(value))}px`;
					}
				}
			},
			setLeft: (id, value, percentage=false) => {
				if((id = SendAudioUtil.Alert.getId(id)) != false && SendAudioUtil.Alert.events[id]){
					SendAudioUtil.Alert.setPos('left', document.getElementById(id), SendAudioUtil.Alert.events[id].dom, percentage);
					return true;
				}
				return false;
			},
			setTop: (id, value, percentage=false) => {
				if((id = SendAudioUtil.Alert.getId(id)) != false && SendAudioUtil.Alert.events[id]){
					SendAudioUtil.Alert.setPos('top', document.getElementById(id), SendAudioUtil.Alert.events[id].dom, percentage);
					return true;
				}
				return false;
			},
			setValue: (id, value) => {
				if((id = SendAudioUtil.Alert.getId(id)) != false){
					const alert = document.getElementById(id);

					if(alert){
						alert.firstElementChild.innerHTML = value;
						return true;
					}
				}
				return false;
			},
			get: (id) => {
				if((id = SendAudioUtil.Alert.getId(id)) != false)
					return SendAudioUtil.Alert.events[id];

				return false;
			}
		}
	};

	const insertButtons = async (plugin, recreate=false) => {

		let element = document.querySelector('#audio-buttons');

		if(recreate){
			SendAudioUtil.removeDom(element);
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
				SendAudioUtil.Alert.add('#audio-buttons button[role=record]');

				

				await SendAudioUtil.sleep(10);
					
				rec.style.adisplay = rec.style.display;
				rec.style.display  = 'flex';

				SendAudioUtil.Alert.add('#audio-buttons button[role=delete]');
				SendAudioUtil.Alert.add('#audio-buttons button[role=send]');
				SendAudioUtil.Alert.add('#audio-buttons div[role=control]');
				
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

		return Upload.upload(channel, new File([blob], SendAudioUtil.randomKey(3) + '-'  + date.substr(0, 10) + '-' + date.substr(11, 8).replace(/:/g, '-') + '.ogg'), {content: '', tts: false});
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

			SendAudioUtil.Alert.add('#audio-buttons-send button[role=delete]');
			SendAudioUtil.Alert.add('#audio-buttons-send button[role=send]');
		}
	};

	const removeButtonsSend = () => {
		SendAudioUtil.Alert.remove('audio-buttons_nsend');
		SendAudioUtil.Alert.remove('audio-buttons_send');
		const ab = document.querySelector('#audio-buttons');
		SendAudioUtil.removeDom(document.getElementById('audio-buttons-send'));

		if(ab)
			ab.style.display = 'inherit';
	};
	const removeAudioButtons = () => {
		SendAudioUtil.Alert.remove('audio_buttons-send');
		SendAudioUtil.Alert.remove('audio_buttons-delete');
		SendAudioUtil.Alert.remove('audio_buttons-record');
		SendAudioUtil.Alert.remove('audio_buttons-control');;
		SendAudioUtil.removeDom(document.getElementById('audio-buttons'));
	};

	const recordingInfoPanel = (plugin) => {
		if(document.getElementById('SendAudio-InfoPanel'))
			return;

		const type = ChannelStore.getChannel(SelectedChannelStore.getChannelId());

        const data = `Recording in ${SendAudioUtil.getChannelName(type)} (${SendAudioUtil.getGuildName(type)})`;
		if(SendAudioUtil.createPanel(`
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
		        
		        SendAudioUtil.Alert.add('#SendAudio-InfoPanel');

		        plugin.panelTime = dom.querySelector('input');
		    }
		    return true;
		}
		return false;
	};
	const removeRecordingInfoPanel = () => {
	    SendAudioUtil.Alert.remove('alert-SendAudio-InfoPanel');
	    SendAudioUtil.removeDom(document.getElementById('SendAudio-InfoPanel'));  
	};

	const setButtonsPauseResume = (state) => {
		const domPause = document.querySelector('#audio-buttons button[role=pause]');
		const domResume = document.querySelector('#audio-buttons button[role=resume]');

		if(domPause && domResume){
			//paused == true
			domPause.parentNode.setAttribute('alert-data', (state ? 'Resume' : 'Pause'));
			SendAudioUtil.Alert.setValue(domPause.parentNode.getAttribute('alert-id'), (state ? 'Resume' : 'Pause')); 
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

			this.recorder = SendAudioUtil.RecorderAudio(this.settings.nitro ? 52428800 : 8388608);

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
				data.time = SendAudioUtil.convertToTime(data.seconds);

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
						plugin.player = SendAudioUtil.createPlayer('SendAudio-Player');

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

			SendAudioUtil.Alert.removeAll();

			PluginUtilities.removeStyle('css-' + this.getName());
	
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
								SendAudioUtil.Alert.setValue(audio_butons_send.getAttribute('alert-id'), 'Preview');
								audio_butons_send.innerHTML = `
									<svg role='save' xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" enable-background="new 0 0 512 512" xml:space="preserve">
										<path d="M504.1,256C504.1,119,393,7.9,256,7.9C119,7.9,7.9,119,7.9,256C7.9,393,119,504.1,256,504.1C393,504.1,504.1,393,504.1,256z"></path>
										<path d="M392.6,172.9c-5.8-15.1-17.7-12.7-30.6-10.1c-7.7,1.6-42,11.6-96.1,68.8c-22.5,23.7-37.3,42.6-47.1,57c-6-7.3-12.8-15.2-20-22.3C176.7,244.2,152,229,151,228.4c-10.3-6.3-23.8-3.1-30.2,7.3c-6.3,10.3-3.1,23.8,7.2,30.2     c0.2,0.1,21.4,13.2,39.6,31.5c18.6,18.6,35.5,43.8,35.7,44.1c4.1,6.2,11,9.8,18.3,9.8c1.2,0,2.5-0.1,3.8-0.3c8.6-1.5,15.4-7.9,17.5-16.3c0.1-0.2,8.8-24.3,54.7-72.7c37-39.1,61.7-51.5,70.3-54.9c0.1,0,0.1,0,0.3,0c0,0,0.3-0.1,0.8-0.4c1.5-0.6,2.3-0.8,2.3-0.8c-0.4,0.1-0.6,0.1-0.6,0.1l0-0.1c4-1.7,11.4-4.9,11.5-5C393.3,196.1,397,184.1,392.6,172.9z"></path>
									</svg>
								`;
							}
							else{
								audio_butons_send.setAttribute('alert-data', 'Send');
								SendAudioUtil.Alert.setValue(audio_butons_send.getAttribute('alert-id'), 'Send');
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
