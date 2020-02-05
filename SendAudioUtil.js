window.SendAudioUtil = {
	//https://stackoverflow.com/questions/951021/what-is-the-javascript-version-of-sleep/39914235#39914235
	sleep: async (ms) => new Promise(resolve => setTimeout(resolve, ms)),
	randomInt: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min,
	randomKey: (len) => {
		if(len < 1)
			return '';

		let ret = '';
		for(let i = 0, j = parseInt(len / 3) + (len % 3); i < j; ++i)
			ret = ret + String.fromCharCode(window.SendAudioUtil.randomInt(65, 90)) + String.fromCharCode(window.SendAudioUtil.randomInt(48, 57)) + String.fromCharCode(window.SendAudioUtil.randomInt(97, 122));

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
		element.innerHTML = html;

		dom.insertBefore(element, dom.firstChild);
		return true;	
	},
	removePanel: (id) => window.SendAudioUtil.removeDom(document.getElementById(id)),
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
		if(window.SendAudioUtil.createPanel(`
		<div class='emilay-player'>
			<div role='header'>
				<div role='title'></div>
				<div role='close'>
					<svg class="closeIcon-rycxaQ da-closeIcon" aria-hidden="false" width="16" height="16" viewBox="0 0 24 24">
						<path fill="currentColor" d="M18.4 4L12 10.4L5.6 4L4 5.6L10.4 12L4 18.4L5.6 20L12 13.6L18.4 20L20 18.4L13.6 12L20 5.6L18.4 4Z"></path>
					</svg>
				</div>
			</div>
			<div role='controller'>
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

			window.SendAudioUtil.Alert.add(`#${id} div[role=time-bar]`);



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
				window.SendAudioUtil.removePanel(id);
				window.SendAudioUtil.Alert.remove(`alert-${id}-preview`);

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
					window.SendAudioUtil.Alert.setPos('left', bar_time_preview, time_bar, value, true);

					bar_time_preview.firstElementChild.innerHTML = window.SendAudioUtil.convertToTime(value * (internal_audio.duration / 100));
					
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
					await window.SendAudioUtil.sleep(500);

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
							await window.SendAudioUtil.sleep(1000);
							internal_audio.currentTime = 10000000 * Math.random();
						}
					
						internal_audio.currentTime = 0;

						current_time.innerHTML = '00:00';

						window.SendAudioUtil.Alert.setPos('left', bar_time_preview, time_bar, 0, false);

						internal_audio.volume = default_volume;

						audio_duration.innerHTML = window.SendAudioUtil.convertToTime(internal_audio.duration);

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
							current_time.innerHTML = window.SendAudioUtil.convertToTime(internal_audio.currentTime);

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
					events.time({seconds: seconds, size: audioSize, strSize: window.SendAudioUtil.convertData(audioSize)});
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
			strSize: () => window.SendAudioUtil.convertData(audioSize),
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

			window.SendAudioUtil.Alert.remove(alert_id);


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

			window.SendAudioUtil.Alert.events[alert_id] = {
				dom: dom,
				over: () => alert_.style.display = 'block',
				out: () => alert_.style.display = 'none'
			};
			dom.addEventListener('mouseover', window.SendAudioUtil.Alert.events[alert_id].over);
			dom.addEventListener('mouseout', window.SendAudioUtil.Alert.events[alert_id].out);
			return alert_;
		},
		getId: (id) => {
			if(!(id in window.SendAudioUtil.Alert.events)){
				id = document.querySelector(id);
				if(!id)
					return false;

				id = id.getAttribute('alert-id');
			}
			if(id in window.SendAudioUtil.Alert.events)
				return id;

			return false;
		},
		remove: (id) => {

			id = window.SendAudioUtil.Alert.getId(id);

			if(id != false){
				if(window.SendAudioUtil.Alert.events[id].dom){
					window.SendAudioUtil.Alert.events[id].dom.removeEventListener('mouseover', window.SendAudioUtil.Alert.events[id].over);
					window.SendAudioUtil.Alert.events[id].dom.removeEventListener('mouseout', window.SendAudioUtil.Alert.events[id].out);

					window.SendAudioUtil.removeDom(document.getElementById(id));
				}

				delete window.SendAudioUtil.Alert.events[id];
			}
		},
		removeAll: () => {
			for(let key in window.SendAudioUtil.Alert.event){
				if(window.SendAudioUtil.Alert.events[key].dom){
					window.SendAudioUtil.Alert.events[key].dom.removeEventListener('mouseover', window.SendAudioUtil.Alert.events[key].over);
					window.SendAudioUtil.Alert.events[key].dom.removeEventListener('mouseout', window.SendAudioUtil.Alert.events[key].out);

					window.SendAudioUtil.removeDom(document.getElementById(key));
				}
			}
			window.SendAudioUtil.Alert.event = {};
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
			if((id = window.SendAudioUtil.Alert.getId(id)) != false && window.SendAudioUtil.Alert.events[id]){
				window.SendAudioUtil.Alert.setPos('left', document.getElementById(id), window.SendAudioUtil.Alert.events[id].dom, percentage);
				return true;
			}
			return false;
		},
		setTop: (id, value, percentage=false) => {
			if((id = window.SendAudioUtil.Alert.getId(id)) != false && window.SendAudioUtil.Alert.events[id]){
				window.SendAudioUtil.Alert.setPos('top', document.getElementById(id), window.SendAudioUtil.Alert.events[id].dom, percentage);
				return true;
			}
			return false;
		},
		setValue: (id, value) => {
			if((id = window.SendAudioUtil.Alert.getId(id)) != false){
				const alert = document.getElementById(id);

				if(alert){
					alert.firstElementChild.innerHTML = value;
					return true;
				}
			}
			return false;
		},
		get: (id) => {
			if((id = window.SendAudioUtil.Alert.getId(id)) != false)
				return window.SendAudioUtil.Alert.events[id];

			return false;
		}
	}
};
