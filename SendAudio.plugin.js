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

if(!('SendAudio_downloadModal' in global))
    global.SendAudio_downloadModal = false;

if(!('SendAudio_ZLibrary' in global))
    global.SendAudio_ZLibrary = ('ZLibrary' in global);

module.exports = (() => {
    const config = {"info":{"name":"Send Audio","authors":[{"name":"Matues","discord_id":"301016626579505162","github_username":"MKSx"}],"version":"1.1.5","description":"Record and send audios in chat","github":"https://github.com/MKSx/EnviarAudio-BetterDiscord","github_raw":"https://raw.githubusercontent.com/MKSx/Send-Audio-Plugin-BetterDiscord/master/SendAudio.plugin.js"},"main":"index.js","defaultConfig":[{"type":"switch","name":"Preview record","id":"preview","value":false,"note":"Allows audio to be heard before being sent"},{"type":"switch","name":"Using nitro","id":"nitro","value":false,"note":"If you are using discord nitro increases the file size that can be used from 8 MB to 50 MB"},{"type":"dropdown","name":"Audio input","id":"devices","note":"The audio recording device that will be used","options":[{"label":"Default","value":"default"}],"value":"default"},{"type":"dropdown","name":"File format","id":"mimetype","note":"The type of file that will be sent","options":[{"label":"mp3","value":"audio/mp3"},{"label":"ogg","value":"audio/ogg"},{"label":"wav","value":"audio/wav"},{"label":"opus","value":"audio/webm;codecs=opus"},{"label":"webm","value":"audio/webm"}],"value":"audio/mp3"}]};


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
                            if(!global.SendAudio_ZLibrary){
                                setTimeout(_ => {
                                    global.ZLibrary = undefined;
                                }, 10000);
                            }
                            
                        });
                    }
                }, props));
            });
        }
    }
    const compilePlugin = ([Plugin, Api]) => {
        const plugin = (Plugin, Api) => {
	const { DOMTools, Logger,  DiscordAPI, DiscordModules, PluginUtilities } = Api;

	const SelectedChannelStore = DiscordModules.SelectedChannelStore;
    const ChannelStore = DiscordModules.ChannelStore;
    const Upload = BdApi.findModule(m => m.upload && typeof m.upload === 'function');

    const addButton = (attr, svg) => DOMTools.createElement(`<button ${attr} class="buttonWrapper-1ZmCpA da-buttonWrapper button-38aScr da-button lookBlank-3eh9lL colorBrand-3pXr91 grow-q77ONN da-grow"><div class="contents-18-Yxp da-contents button-3AYNKb da-button translateButton-DhP9x8 button-318s1X">${svg}</div></button>`);
    const addPanel = (html, attr, remove=false) => {
        let dom = document.querySelector('.panels-j1Uci_');

        if(!(dom instanceof Element))
            return false;

        if(document.querySelector(`div[${attr}]`) instanceof Element){
            if(!remove)
                return false;
                
            document.querySelector(`div[${attr}]`).remove();
        }
        return dom.insertBefore(DOMTools.createElement(`<div class='panel-24C3ux da-panel activityPanel-28dQGo da-activityPanel' ${attr}>${html}</div>`), dom.firstChild);
    };

    const getChannelName = () => {
        const channel = DiscordAPI.currentChannel;

        if(channel.type == 'GROUP_DM'){
            return (DiscordAPI.currentChannel ? DiscordAPI.currentChannel.name : 'Unknown channel');
        }
        else if(channel.type == 'DM'){
            const recipient = DiscordAPI.currentChannel.recipient;
            return '@' + recipient.username + '#' + recipient.discriminator;
        }
        return '#' + channel.name;
    };
    const getGuildName = () => {
        const channel = DiscordAPI.currentChannel;

        if(channel.type != 'GUILD_TEXT'){
            return channel.type;
        }

        if(DiscordAPI.currentGuild)
            return DiscordAPI.currentGuild.name;

        return 'Unknown server';
    };
    const convertToTime = (seconds) => {
        seconds = parseInt(seconds);
        return typeof seconds == 'number' && seconds > -1 ? new Date(parseInt(seconds) * 1000).toISOString().substr(11, 8) : '00:00:00';
    };
    const convertData = (size) => {
        //MB
        if(size >= 1048576){
            temp = (size / 1024) % 1024;

            return `${parseInt((size / 1024) / 1024)}${temp != 0 ? ('.' + temp).slice(0, 3) : ''} MB`;
        }
        temp = size % 1024;
        return `${parseInt(size / 1024)}${temp != 0 ? ('.' + temp).slice(0,3) : ''} KB`;
    };
    const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
    const randomKey = (len) => {
        if(len < 1)
            return '';

        let ret = '';
        for(let i = 0, j = parseInt(len / 3) + (len % 3); i < j; ++i)
            ret = ret + String.fromCharCode(randomInt(65, 90)) + String.fromCharCode(randomInt(48, 57)) + String.fromCharCode(randomInt(97, 122));

        return ret.slice(0, len);
    };
    const sendAudio = (channel, blob) => {

        let date = new Date();

        date = new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString();

        return Upload.upload(channel, new File([blob], randomKey(3) + '-'  + date.substr(0, 10) + '-' + date.substr(11, 8).replace(/:/g, '-') + '.mp3'), {content: '', tts: false});
    };

    const DiscordPlayer = (() => {
        
        const addPlayer = (attr) => {
            return addPanel(`
            <h2 class='DiscordPlayerLoading'>Loading audio <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid"><path d="M10 50A40 40 0 0 0 90 50A40 42 0 0 1 10 50" transform="rotate(98.5543 50 51)"><animateTransform attributeName="transform" type="rotate" dur="1s" repeatCount="indefinite" keyTimes="0;1" values="0 50 51;360 50 51"></animateTransform></path></svg></h2>
            <div class='DiscordPlayer' style='position: relative;'>
                <div role='header'>
                    <input type='text' value='Discord Player' readonly>
                    <div>
                        <svg class="closeIcon-rycxaQ da-closeIcon" aria-hidden="false" width="16" height="16" viewBox="0 0 24 24">
                            <path fill="currentColor" d="M18.4 4L12 10.4L5.6 4L4 5.6L10.4 12L4 18.4L5.6 20L12 13.6L18.4 20L20 18.4L13.6 12L20 5.6L18.4 4Z"></path>
                        </svg>
                    </div>
                </div>
                <div role='controls'>
                    <div tabindex="0" role="button" style="width: 10%;">
                        <svg name="Play" class="controlIcon-3cRbti da-controlIcon" aria-hidden="false" width="16" height="16" viewBox="0 0 24 24"><polygon fill="currentColor" points="0 0 0 14 11 7" transform="translate(7 5)"></polygon></svg>
                    </div>
                    <div class="durationTimeWrapper-OugPFt da-durationTimeWrapper" style="width: 70%;">
                        <span class="durationTimeDisplay-jww5fr da-durationTimeDisplay">00:00:00</span>
                        <span class="durationTimeSeparator-2_xpJ7 da-durationTimeSeparator">/</span>
                        <span class="durationTimeDisplay-jww5fr da-durationTimeDisplay">--:--:--</span>
                    </div>
                    <div class="flex-1O1GKY da-flex" style="position: absolute;right: 0;">
                        <div tabindex="0" role="button">
                            <svg name="Speaker" class="controlIcon-3cRbti da-controlIcon" aria-hidden="false" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" fill-rule="evenodd" clip-rule="evenodd" d="M11.383 3.07904C11.009 2.92504 10.579 3.01004 10.293 3.29604L6 8.00204H3C2.45 8.00204 2 8.45304 2 9.00204V15.002C2 15.552 2.45 16.002 3 16.002H6L10.293 20.71C10.579 20.996 11.009 21.082 11.383 20.927C11.757 20.772 12 20.407 12 20.002V4.00204C12 3.59904 11.757 3.23204 11.383 3.07904ZM14 5.00195V7.00195C16.757 7.00195 19 9.24595 19 12.002C19 14.759 16.757 17.002 14 17.002V19.002C17.86 19.002 21 15.863 21 12.002C21 8.14295 17.86 5.00195 14 5.00195ZM14 9.00195C15.654 9.00195 17 10.349 17 12.002C17 13.657 15.654 15.002 14 15.002V13.002C14.551 13.002 15 12.553 15 12.002C15 11.451 14.551 11.002 14 11.002V9.00195Z"></path></svg>
                        </div>
                    </div>
                    <div class="audioVolumeWrapper-2t9juP da-audioVolumeWrapper hidden-3leZhk da-hidden" style="bottom: 0px;">
                        <div class="vertical-1gJnJQ da-vertical">
                            <div class="mediaBarInteraction-37i2O4 da-mediaBarInteraction mediaBarInteractionVolume-3QZqYd da-mediaBarInteractionVolume">
                                <div class="mediaBarWrapper-3D7r67 fakeEdges-27pgtp da-mediaBarWrapper da-fakeEdges mediaBarWrapperVolume-354-jo da-mediaBarWrapperVolume">
                                    <div class="mediaBarProgress-1xaPtl fakeEdges-27pgtp da-mediaBarProgress da-fakeEdges" style="width: 81.6854%;">
                                        <span class="mediaBarGrabber-1FqnbN da-mediaBarGrabber"></span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="horizontal-3Sq5iO da-horizontal">
                    <div class="mediaBarInteraction-37i2O4 da-mediaBarInteraction">
                        <div class="mediaBarWrapper-3D7r67 fakeEdges-27pgtp da-mediaBarWrapper da-fakeEdges" role='control-bar'>
                            <div class="mediaBarPreview-1jfyFs fakeEdges-27pgtp da-mediaBarPreview da-fakeEdges"></div>
                            <div class="mediaBarProgress-1xaPtl fakeEdges-27pgtp da-mediaBarProgress da-fakeEdges">
                                <span class="mediaBarGrabber-1FqnbN da-mediaBarGrabber"></span>
                            </div>
                            <div class="bubble-3qRl2J da-bubble" style='position: fixed;'>00:00:00</div>
                        </div>
                    </div>
                </div>
            </div>`, attr);
        };
        return class{
            constructor(){
                this.audio = false;

                this.events = {
                    'end': null,
                    'start': null,
                    'close': null
                };
                this.setDuration = false;
                this.id = DiscordModules.KeyGenerator();
                this.audioReady = false;
                this.playerRef = addPlayer(`id='${this.id}'`);
                this.playerLoading = this.playerRef.find(`h2[class='DiscordPlayerLoading']`);
                this.playerTime = {current: null, duration: null};
                this.playerVolume = {lastValue: 1, moving: false, timer: null, button: null, bar: null, ref: null, bounding: null, svg: null};
                this.playerDuration = {ref: null, moving: false, current: null, preview: null, tooltip: null, bounding: null, tooltipHeight: 0, lastUpdate: 0, paused: false};
                this.playerButton = null;
                this.playerClose = null;
                this.playerTitle = null;

                this.playerVolume.button = this.playerRef.find(`div[class="flex-1O1GKY da-flex"]`);
                this.playerVolume.ref = this.playerRef.find(`div[class~="audioVolumeWrapper-2t9juP"]`);
                this.playerVolume.bar = this.playerVolume.ref.find(`div[class~='mediaBarProgress-1xaPtl']`);
                this.playerVolume.svg = this.playerVolume.button.find(`div[class="flex-1O1GKY da-flex"] svg`);
                this.playerVolume.bounding = this.playerVolume.bar.parentNode.getBoundingClientRect();

                this.playerDuration.ref = this.playerRef.find(`div[class="mediaBarInteraction-37i2O4 da-mediaBarInteraction"] div`);
                this.playerDuration.current = this.playerDuration.ref.find(`div[class~="mediaBarProgress-1xaPtl"]`);
                this.playerDuration.preview = this.playerDuration.ref.find(`div[class~="mediaBarPreview-1jfyFs"]`);
                this.playerDuration.tooltip = this.playerDuration.ref.find(`div[class~="bubble-3qRl2J"]`);
                this.playerDuration.bounding = this.playerDuration.ref.parentNode.getBoundingClientRect();
                this.playerDuration.tooltipHeight = this.playerDuration.tooltip.getBoundingClientRect().height;

                this.playerDuration.lastUpdate = Date.now();
                this.playerClose = this.playerRef.find(`div[role=header] div`);
                this.playerTitle = this.playerRef.find(`div[role=header] input`);

                this.playerClose.addEventListener('click', _ => this.close());

                this.playerTime.duration = this.playerRef.find(`div[class='durationTimeWrapper-OugPFt da-durationTimeWrapper']`).lastElementChild;
                this.playerTime.current = this.playerRef.find(`div[class='durationTimeWrapper-OugPFt da-durationTimeWrapper']`).firstElementChild;

                this.playerButton = this.playerRef.find(`div[role="button"]`);

                this.playerButton.addEventListener('click', _ => {
                    if(!(this.audio instanceof Audio) || this.audio.readyState == 0)
                        return;

                    if(this.audio.paused || this.audio.ended)
                        this.audio.play();
                    else
                        this.audio.pause();
                });
                this.playerVolume.button.addEventListener('click', _ => {
                    if(!(this.audio instanceof Audio) || this.audio.readyState == 0)
                        return;

                    if(this.audio.volume > 0){
                        this.playerVolume.lastValue = this.audio.volume;
                        this.audio.volume = 0;
                    }
                    else{
                        this.audio.volume = this.playerVolume.lastValue;
                    }
                });

                const showVolumeBar = () => {
                    this.playerVolume.ref.style.visibility = 'visible';
                    this.playerVolume.svg.style.opacity = '1';

                    if(this.playerVolume.timer != null){
                        clearInterval(this.playerVolume.timer);
                        this.playerVolume.timer = null;   
                    }
                };
                const hideVolumeBar = () => {
                    if(this.playerVolume.timer == null){
                        this.playerVolume.timer = setTimeout(plugin => {
                            plugin.playerVolume.ref.style.visibility = '';
                            plugin.playerVolume.svg.style.opacity = '';
                            this.playerVolume.timer = null;
                        }, 1000, this);
                    }
                };
                const moveVolumeBar = (e, click=false) => {
                    if(!(this.audio instanceof Audio) || this.audio.readyState == 0)
                        return;

                    const value = Math.min(1, Math.max(0, (this.playerVolume.bounding.bottom - e.clientY) / this.playerVolume.bounding.height)) * 100;
                    
                    if(click || this.playerVolume.moving){
                        //player.volume.bar.style.width = `${value}%`;
                        this.audio.volume = value / 100;
                    }
                };
                const moveBar = (e, click=false) => {
                    if(!(this.audio instanceof Audio) || this.audio.readyState == 0)
                        return;

                    const value = Math.min(1, Math.max(0, (e.clientX - this.playerDuration.bounding.left) / this.playerDuration.bounding.width)) * 100;
                    
                    if(click || this.playerDuration.moving){
                        if(this.playerDuration.current instanceof Element){
                            //player.duration.current.style.width = `${value}%`;
                            //player.audio.currentTime = (player.audio.duration / 100) * value;
                            this.audio.currentTime = (value / 100) * this.audio.duration;

                            if(this.audio.currentTime != this.audio.duration)
                                if(this.playerButton.firstElementChild.getAttribute('name') == "Replay")
                                    this.playerButton.innerHTML = `<svg name="Play" class="controlIcon-3cRbti da-controlIcon" aria-hidden="false" width="16" height="16" viewBox="0 0 24 24"><polygon fill="currentColor" points="0 0 0 14 11 7" transform="translate(7 5)"></polygon></svg>`;

                        }
                    }
                    if(this.playerDuration.tooltip instanceof Element){
                        if(Date.now() - this.playerDuration.lastUpdate > 10000)
                            this.playerDuration.bounding = this.playerDuration.ref.parentNode.getBoundingClientRect();

                        this.playerDuration.tooltip.innerHTML = convertToTime((value / 100) * this.audio.duration);
                        this.playerDuration.tooltip.style.left = `${this.playerDuration.bounding.left + ((this.playerDuration.bounding.width / 100) * value)}px`;
                        this.playerDuration.tooltip.style.top = `${this.playerDuration.bounding.top - this.playerDuration.tooltipHeight - 10}px`;
                    }
                    if(this.playerDuration.preview instanceof Element)
                        this.playerDuration.preview.style.width = `${value}%`;
                    
                };

                this.playerVolume.button.addEventListener('mouseover', showVolumeBar);
                this.playerVolume.button.addEventListener('mouseout', hideVolumeBar);
                this.playerVolume.ref.firstElementChild.addEventListener('mouseover', showVolumeBar);
                this.playerVolume.ref.firstElementChild.addEventListener('mouseout', hideVolumeBar);

                this.playerVolume.bar.parentNode.addEventListener('click', e => moveVolumeBar(e, true));
                this.playerVolume.bar.parentNode.addEventListener('mousemove', e => moveVolumeBar(e));
                this.playerVolume.bar.parentNode.addEventListener('mousedown', _ => this.playerVolume.moving = true);
                this.playerVolume.bar.parentNode.addEventListener('mouseup', _ => this.playerVolume.moving = false);
                this.playerVolume.bar.parentNode.addEventListener('mouseleave', _ => this.playerVolume.moving = false);

                this.playerDuration.ref.addEventListener('click', e => moveBar(e, true));
                this.playerDuration.ref.addEventListener('mousemove', e => moveBar(e));

                this.playerDuration.ref.addEventListener('mousedown', _ => {
                    if(this.audio instanceof Audio && this.audio.readyState != 0){
                        this.playerDuration.moving = true;

                        if(!(this.playerDuration.paused = this.audio.paused || this.audio.ended))
                            this.audio.pause();
                    }
                });
                const dragEnd = () => {
                	if(this.playerDuration.preview instanceof Element)
                        this.playerDuration.preview.style.width = `0%`;

                    if(this.playerDuration.moving){
                        if(!this.playerDuration.paused)
                            this.audio.play().catch(err => Logger.error(err));

                        this.playerDuration.moving = false;
                    }
                };

                this.playerDuration.ref.addEventListener('mouseup', dragEnd);
                this.playerDuration.ref.addEventListener('mouseleave', dragEnd);

                this.playerRef.style.display = 'none';

            }
            close(){
                if(this.audio instanceof Audio && (!this.audio.paused && !this.audio.ended))
                    this.audio.pause();

                if(this.playerRef instanceof Element)
                    this.playerRef.remove();

                if(typeof this.events.close == 'function')
                    this.events.close();
            }
            async setAudio(audio){
                if(!(audio instanceof Audio))
                    return false;

                if(this.audio instanceof Audio){
                    if(!this.audio.paused && !this.audio.ended)
                        this.audio.pause();

                    this.playerDuration.moving = false;
                    this.playerVolume.moving = false;

                    this.audio.currentTime = 0;
                    this.audio.volume = 1;
                    this.audio = null;
                }

                /*
				Fix audio duration:
				https://stackoverflow.com/questions/21522036/html-audio-tag-duration-always-infinity/52375280#52375280
				*/
				const fix_audio = async () => {
					this.playerLoading.style.display = 'block';
          			this.playerRef.find(`div[class='DiscordPlayer']`).style.display = 'none';

					while(audio.duration == Infinity || isNaN(audio.duration)){
	                	audio.currentTime = 10000000 * Math.random();
	                	await new Promise(resolve => setTimeout(resolve, 1000));
	                }
                	audio.currentTime = 0;
                	this.playerButton.innerHTML = `<svg name="Play" class="controlIcon-3cRbti da-controlIcon" aria-hidden="false" width="16" height="16" viewBox="0 0 24 24"><polygon fill="currentColor" points="0 0 0 14 11 7" transform="translate(7 5)"></polygon></svg>`;
                	await new Promise(resolve => setTimeout(resolve, 1000));
                	this.playerLoading.style.display = 'none';
          			this.playerRef.find(`div[class='DiscordPlayer']`).style.display = 'block';
				};
          		
                this.audioReady = audio.readyState != 0;
                if(audio.readyState == 0){
                    this.playerTime.duration.innerHTML = '--:--:--';
                    audio.addEventListener('loadedmetadata', async _ => {
                    	await fix_audio();
                        this.audioReady = this.audio.readyState != 0;
                        this.playerTime.duration.innerHTML = convertToTime(audio.duration);

                    });
                }
                else{
                	await fix_audio();
                	this.playerTime.duration.innerHTML = convertToTime(audio.duration);
                }
                this.audio = audio;
                this.playerVolume.bar.style.width = `${this.audio.volume * 100}%`;
                this.playerTime.current.innerHTML = '00:00:00';
                this.audio.addEventListener('timeupdate', _ => {
                    this.playerDuration.current.style.width = `${(this.audio.currentTime / this.audio.duration) * 100}%`;
                    this.playerTime.current.innerHTML = convertToTime(this.audio.currentTime);
                });
                this.audio.addEventListener('volumechange', _ => {
                    this.playerVolume.bar.style.width = `${this.audio.volume * 100}%`;
                    if(this.audio.volume == 0){ 
                        this.playerVolume.button.innerHTML = `<div tabindex="0" role="button"><svg name="SpeakerOff" class="controlIcon-3cRbti da-controlIcon" aria-hidden="false" width="16" height="16" viewBox="0 0 24 24"><path fill="currentColor" d="M13.5,9 C13.5,7.23 12.48,5.71 11,4.97 L11,7.18 L13.45,9.63 C13.48,9.43 13.5,9.22 13.5,9 L13.5,9 Z M16,9 C16,9.94 15.8,10.82 15.46,11.64 L16.97,13.15 C17.63,11.91 18,10.5 18,9 C18,4.72 15.01,1.14 11,0.23 L11,2.29 C13.89,3.15 16,5.83 16,9 L16,9 Z M1.27,0 L0,1.27 L4.73,6 L0,6 L0,12 L4,12 L9,17 L9,10.27 L13.25,14.52 C12.58,15.04 11.83,15.45 11,15.7 L11,17.76 C12.38,17.45 13.63,16.81 14.69,15.95 L16.73,18 L18,16.73 L9,7.73 L1.27,0 L1.27,0 Z M9,1 L6.91,3.09 L9,5.18 L9,1 L9,1 Z" transform="translate(3 3)"></path></svg></div>`;
                        
                        this.playerVolume.svg = this.playerVolume.button.find('svg');
                        this.playerVolume.svg.style.opacity = '1';
                    }
                    else{
                        if(this.playerVolume.svg.getAttribute('name') != 'Speaker'){
                            this.playerVolume.button.innerHTML = `<div tabindex="0" role="button"><svg name="Speaker" class="controlIcon-3cRbti da-controlIcon" aria-hidden="false" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" fill-rule="evenodd" clip-rule="evenodd" d="M11.383 3.07904C11.009 2.92504 10.579 3.01004 10.293 3.29604L6 8.00204H3C2.45 8.00204 2 8.45304 2 9.00204V15.002C2 15.552 2.45 16.002 3 16.002H6L10.293 20.71C10.579 20.996 11.009 21.082 11.383 20.927C11.757 20.772 12 20.407 12 20.002V4.00204C12 3.59904 11.757 3.23204 11.383 3.07904ZM14 5.00195V7.00195C16.757 7.00195 19 9.24595 19 12.002C19 14.759 16.757 17.002 14 17.002V19.002C17.86 19.002 21 15.863 21 12.002C21 8.14295 17.86 5.00195 14 5.00195ZM14 9.00195C15.654 9.00195 17 10.349 17 12.002C17 13.657 15.654 15.002 14 15.002V13.002C14.551 13.002 15 12.553 15 12.002C15 11.451 14.551 11.002 14 11.002V9.00195Z"></path></svg></div>`;
                            this.playerVolume.svg = this.playerVolume.button.find('svg');
                            this.playerVolume.svg.style.opacity = '1';
                        }
                    }
                });
                this.audio.addEventListener('play', _ => {
                    this.playerButton.innerHTML = `<svg name="Pause" class="controlIcon-3cRbti da-controlIcon" aria-hidden="false" width="16" height="16" viewBox="0 0 24 24"><path fill="currentColor" d="M0,14 L4,14 L4,0 L0,0 L0,14 L0,14 Z M8,0 L8,14 L12,14 L12,0 L8,0 L8,0 Z" transform="translate(6 5)"></path></svg>`;
                });

                this.audio.addEventListener('pause', _ => {
                    this.playerButton.innerHTML = `<svg name="Play" class="controlIcon-3cRbti da-controlIcon" aria-hidden="false" width="16" height="16" viewBox="0 0 24 24"><polygon fill="currentColor" points="0 0 0 14 11 7" transform="translate(7 5)"></polygon></svg>`;
                });
                
                this.audio.addEventListener('ended', _ => {
                    this.playerButton.innerHTML = `<svg name="Replay" class="controlIcon-3cRbti da-controlIcon" aria-hidden="false" width="16" height="16" viewBox="0 0 24 24"><path fill="currentColor" d="M12,5 L12,1 L7,6 L12,11 L12,7 C15.31,7 18,9.69 18,13 C18,16.31 15.31,19 12,19 C8.69,19 6,16.31 6,13 L4,13 C4,17.42 7.58,21 12,21 C16.42,21 20,17.42 20,13 C20,8.58 16.42,5 12,5 L12,5 Z"></path></svg>`;
                });
                return true;
            }
            setAudioLink(link){return this.setAudio(new Audio(link));}
            setTitle(title){this.playerTitle.value = title;}
            getTitle(){return this.playerTitle.value;}
            getAudio(){return this.audio;}
            play(){
                if(this.audio instanceof Audio && this.audio.readyState != 0){
                    if(this.audio.paused || this.audio.ended)
                        this.audio.play();

                    return true;
                }
                return false;
            }
            pause(){
                if(this.audio instanceof Audio && this.audio.readyState != 0){
                    if(!(this.audio.paused && this.audio.ended))
                        this.audio.pause();

                    return true;
                }
                return false;
            }
            setTime(time){
                if(this.audio instanceof Audio && this.audio.readyState != 0){
                    this.audio.currentTime = time;
                    return true;
                }
                return false;
            }
            setVolume(volume){
                if(this.audio instanceof Audio){
                    this.audio.volume = volume;
                    return true;
                }
                return false;
            }
            getTime(){return this.audio instanceof Audio ? this.audio.currentTime : 0;}
            setMuted(e){
                if(this.audio instanceof Audio){
                    if(e){
                        this.playerVolume.lastValue = this.audio.volume > 0 ? this.audio.volume : 1;
                        this.audio.volume = 0;
                    }
                    else
                        this.audio.volume = this.playerVolume.lastValue;

                    return true;
                }
                return false;
            }
            getVolume(){ return this.audio instanceof Audio ? this.audio.volume : 0;}
            on(event, call){
                if(event in this.events)
                    this.events[event] = call;
            }
            display(value){this.playerRef.style.display = value;}
        };
    })();

    const Tooltip = ((KeyGenerator, DOMTools) => {
        const classList = {
            'top': 'tooltipBottom-3ARrEK',
            'left': 'tooltipRight-2JM5PQ',
            'bottom': 'tooltipTop-XDDSxx',
            'right': 'tooltipLeft-3EDOk1'
        };

        const root = document.querySelector(`.layerContainer-yqaFcK:nth-of-type(2)`)

        if(!root instanceof Element)
            return null;

        const calcAxis = (type, node, tooltip, tooltipPointer) => {
            if(type == 'bottom')
                return {'top': `${node.y - tooltipPointer.height - tooltip.height}px`,'left': `${node.x + (node.width / 2) - (tooltip.width / 2)}px`};
            else if(type == 'top')
                return {'top': `${node.y + node.height + tooltipPointer.height}px`,'left': `${node.x + (node.width / 2) - (tooltip.width / 2)}px`};
            else if(type == 'right')
                return {'top': `${node.y + (node.height / 2) - (tooltip.height / 2)}px`,'left': `${node.x - tooltip.width - tooltipPointer.width}px`};
            else if(type == 'left')
                return {'top': `${node.y + (node.height / 2) - (tooltip.height / 2)}px`,'left': `${node.x + node.width + tooltipPointer.width}px`};

            return {'top': '0px', 'left': '0px'};
        };
        return class Tooltip{
            constructor(node, text, type='bottom'){
                if(!(type in classList))
                    type = 'bottom';

                this.props = {
                    'id': KeyGenerator(),
                    'type': type,
                    'text': text,
                    'ref': null,
                    'target': node,
                    'lastUpdate': 0,
                    'update': 10000 //10 seconds
                };
                this.props.ref = root.appendChild(DOMTools.createElement(`<div class='layer-v9HyYc da-layer disabledPointerEvents-1ptgTB da-disabledPointerEvents' id='${this.props.id}'><div class='tooltip-2QfLtc da-tooltip ${classList[type]} tooltipBlack-PPG47z' style='opacity: 1; transform: none;'><div class='tooltipPointer-3ZfirK da-tooltipPointer'></div><div role='text'>${text}</div></div></div>`));

                this.removed = false;
                this.enabled = true;
                this.Offsets = {
                    target: null,
                    ref: null,
                    pointerRef: null
                };

                this.props.ref.style.display = 'none';
                if(node instanceof Element){
                    this.update();
                    this.props.target.setAttribute('tooltip-id', this.props.id);
                    node.addEventListener('mouseenter', this.show);
                    node.addEventListener('mouseleave', this.hide);
                }
            }
            show(){
                if(this.enabled && !this.removed && this.props.ref instanceof Element){
                    if(this.props.lastUpdate + this.props.update < Date.now())
                        this.update();

                    this.props.ref.style.display = 'block';
                    return true;
                }
                return false;
            }
            hide(){
                if(this.enabled && !this.removed && this.props.ref instanceof Element){
                    this.props.ref.style.display = 'none';
                    return true;
                }
                return false;
            }
            enable(e){
                this.enabled = e;
            }
            toggle(){
                if(this.enabled && this.props.ref instanceof Element)
                    return this.props.ref.style.display == 'none' ? this.show() : this.hide();

                return false;
            }
            create(force=false){
                if(this.removed || force){
                    this.props.ref = root.appendChild(DOMTools.createElement(`<div class='layer-v9HyYc da-layer disabledPointerEvents-1ptgTB da-disabledPointerEvents' id='${this.props.id}'><div class='tooltip-2QfLtc da-tooltip ${classList[this.props.type]} tooltipBlack-PPG47z' style='opacity: 1; transform: none;'><div class='tooltipPointer-3ZfirK da-tooltipPointer'></div><div role='text'>${this.props.text}</div></div></div>`))
                    this.props.ref.style.display = 'none';
                    this.removed = false;

                    this.update();
                }
            }
            setTarget(node){
                if(node instanceof Element){
                    if(this.props.target instanceof Element){
                        this.props.target.removeEventListener('mouseenter', this.show);
                        this.props.target.removeEventListener('mouseleave', this.hide);
                    }
                    this.props.target = node;
                    node.addEventListener('mouseenter', this.show);
                    node.addEventListener('mouseleave', this.hide);

                    if(this.removed)
                        this.create();
                    else
                        this.update();

                    return true;
                }
                return false;
            }
            setText(text){
                if(!this.removed){
                    this.props.text = text;

                    if(this.props.ref instanceof Element){
                        const node = this.props.ref.find('div[role=text]')
                        if(node instanceof Element){
                            node.innerHTML = text;
                            return true;
                        }

                    }
                }
                return false;
            }
            setType(type){
                if(!this.removed && type in classList){
                    if(this.props.ref instanceof Element){
                        this.props.ref.removeClass(classList[this.props.type]);
                        this.props.ref.addClass(classList[type]);
                        this.props.type = type;

                        this.update();
                        return true;
                    }
                }
                return false;
            }
            remove(){
                if(!this.removed){
                    
                    if(this.props.target instanceof Element){
                        this.props.target.removeEventListener('mouseenter', this.show);
                        this.props.target.removeEventListener('mouseleave', this.hide);
                    }

                    if(this.props.ref instanceof Element)
                        this.props.ref.remove();

                    this.props.ref = null;
                    this.props.target = null;

                    this.removed = true;
                }
            }
            update(){
                let displayValue = [false, false];

                if(this.props.ref.style.display != 'none')
                    displayValue[0] = true;
                else
                    this.props.ref.style.display = 'block';
                
                if(this.props.target.style.display != 'none')
                    displayValue[1] = true;
                else
                    this.props.target.style.display = 'block';

                this.Offsets = {
                    target: this.props.target.getBoundingClientRect(),
                    ref: this.props.ref.getBoundingClientRect(),
                    pointerRef: this.props.ref.querySelector(`div[class~='da-tooltipPointer']`).getBoundingClientRect()
                };

                const { top, left } = calcAxis(this.props.type, this.Offsets.target, this.Offsets.ref, this.Offsets.pointerRef);
                
                this.props.ref.style.top = top;
                this.props.ref.style.left = left;

                if(!displayValue[0])
                    this.props.ref.style.display = 'none';

                if(!displayValue[1])
                    this.props.target.style.display = 'none';

                this.props.lastUpdate = Date.now();
            }
        };
    })(DiscordModules.KeyGenerator, DOMTools);
    return class SendAudio extends Plugin {

        onStart() {
            if(!document.getElementById('css-' + this.getName())){
                PluginUtilities.addStyle('css-' + this.getName(),`
                :root{--sendaudio-record: var(--interactive-normal);--sendaudio-record-hover: var(--interactive-active);--sendaudio-cancel: var(--interactive-normal);--sendaudio-cancel-hover: var(--interactive-active);--sendaudio-pause: var(--interactive-normal);--sendaudio-pause-hover: var(--interactive-active);--sendaudio-play: var(--interactive-normal);--sendaudio-play-hover: var(--interactive-active);--sendaudio-save: var(--interactive-normal);--sendaudio-save-hover: var(--interactive-active);--sendaudio-send: var(--interactive-normal);--sendaudio-send-hover: var(--interactive-active);}
                .flash-record{width: 14px;height: 14px;border-radius:50%;position: relative;top: 2px;margin: 0 2px;animation: flash linear 1s infinite;}
                @keyframes flash{0% {opacity: 1;}50% {opacity: .1;}100% {opacity: 1;}}
                .DiscordPlayer div[role='header']{color: var(--text-normal);display: flex;-webkit-box-align: center;align-items: center;border-bottom: 5px;}
                .DiscordPlayer div[role='header'] input{border: none;background: transparent;color: var(--header-primary);font-weight: 600;}
                .DiscordPlayer div[role='header'] div{position: absolute;right: 0;opacity: .3;cursor: pointer;}
                .DiscordPlayer div[role='header'] div:hover{opacity: 1 !important;}
                .DiscordPlayer div[role='controls']{color: white;display: flex;-webkit-box-align: center;align-items: center;}
                .DiscordPlayerLoading{display:none;color: var(--header-primary);font-weight: 600;text-align: center;padding: 5px;}
                .DiscordPlayerLoading path{fill: var(--header-primary);stroke: var(--header-primary);stroke-width: 5px;}
                .DiscordPlayerLoading svg{width: 16px;height: 16px;}
                .DiscordPlayer div[class='durationTimeWrapper-OugPFt da-durationTimeWrapper']{color: var(--text-normal);}
                .DiscordPlayer div[role=button] svg{color: var(--interactive-normal);opacity: 1;}
                .DiscordPlayer div[role=button]:hover svg{color: var(--interactive-active);opacity: 1;}
                .DiscordPlayer div[role='control-bar'], .DiscordPlayer div[role='control-bar']:after, .DiscordPlayer div[role='control-bar']:before{background-color: var(--interactive-muted);}
                .DiscordPlayer div[role='control-bar'] div[class~='mediaBarPreview-1jfyFs'], .DiscordPlayer div[role='control-bar'] div[class~='mediaBarPreview-1jfyFs']:after, .DiscordPlayer div[role='control-bar'] div[class~='mediaBarPreview-1jfyFs']:before{background-color: var(--text-normal);}
                .SendAudio-Info input{border: none;background: transparent;color: var(--header-primary);font-weight: 600;}
                #sendAudioButtons button[role=send] polygon{fill: var(--sendaudio-send) !important;}
                #sendAudioButtons button[role=send]:hover polygon{fill: var(--sendaudio-send-hover) !important;}
                #sendAudioButtons button[role=save] svg{border: 1px solid var(--sendaudio-save) !important;}
                #sendAudioButtons button[role=save] svg path:last-child{fill: var(--sendaudio-save) !important;}

                #sendAudioButtons button[role=save]:hover svg{border: 1px solid var(--sendaudio-save-hover) !important;}
                #sendAudioButtons button[role=save]:hover svg path:last-child{fill: var(--sendaudio-save-hover) !important;}
                #sendAudioButtons button[role=play] svg{color: var(--sendaudio-play) !important;}
                #sendAudioButtons button[role=play]:hover svg{color: var(--sendaudio-play-hover) !important;}
                #sendAudioButtons button[role=pause] path{fill: var(--sendaudio-pause) !important;}
                #sendAudioButtons button[role=pause]:hover path{fill: var(--sendaudio-pause-hover) !important;}
                #sendAudioButtons button[role=cancel] path{fill: var(--sendaudio-cancel) !important;}
                #sendAudioButtons button[role=cancel]:hover path{fill: var(--sendaudio-cancel-hover) !important;}
                #sendAudioButtons button[role=record] svg{color: var(--sendaudio-record) !important;}
                #sendAudioButtons button[role=record]:hover svg{color: var(--sendaudio-record-hover) !important;}
                .plugin-settings[id="plugin-settings-${this.getName()}"] > div{padding: 20px;}
                `);
            }

            this.devices = false;

            this.media = false;

            this.mediaInfo = {
                ready: false,
                error: false
            };
            this.panelInfo = [false, false];

            this.player = null;
            
            this.record = {
                chunks: [],
                blob: null,
                max_size: this.settings.nitro ? 52428800 : 8388608,
                size: 0,
                time: 0,
                limitStop: false,
                notSave: false,
                channel: null,
                previewing: false
            };

            this.tooltips = {
                'record': new Tooltip(null, 'Record'),
                'cancel': new Tooltip(null, 'Cancel'),
                'pause': new Tooltip(null, 'Pause'),
                'play': new Tooltip(null, 'Play'),
                'resume': new Tooltip(null, 'Resume'),
                'save': new Tooltip(null, 'Save'),
                'send': new Tooltip(null, 'Send'),
                'info': new Tooltip(null, 'Info')
            };

            //Init devices

            let plugin = this;

        	navigator.mediaDevices.enumerateDevices().then(devices => {
        		plugin.devices = devices.filter(device => device.kind == 'audioinput' && device.deviceId != 'default');

        		let addeds = [];
                
        		plugin.devices.forEach(device => {
        			if(addeds.indexOf(device.groupId) == -1){
                        plugin._config.defaultConfig.filter(k => k.id == 'devices')[0].options.push({label: device.label, value: device.deviceId});
                        addeds.push(device.groupId);
                    }
        		});
        	}).catch(error => {
                Logger.warn('Unable to get recording devices:', error);
        	});

            this.onSwitch();

            this.changeMedia();
        }

        onStop() {

            this.mediaInfo.notSave = true;
            this.recordStop();

            if(typeof this.buttons == 'object' && this.buttons.group instanceof Element)
            	this.buttons.group.remove();

            this.recordReset();

            PluginUtilities.removeStyle('css-' + this.getName());

            for(let k in this.tooltips){
                this.tooltips[k].remove();
            }
        }

        onSwitch(){
        	if(!this.addButtons())
        		return;
        }

        addButtons(){
        	if(document.getElementById('sendAudioButtons') instanceof Element)
                return false;

            let buttons_ = document.querySelector(`div[class="buttons-3JBrkn"]`);
            let uploadButton = document.getElementsByClassName('attachButton-2WznTc');

            if(!(buttons_ instanceof Element) || (!uploadButton || !(uploadButton[0] instanceof Element)))
                return false;

            this.buttons = {
            	group: DOMTools.createElement(`<div class="buttonContainer-28fw2U da-buttonContainer" id='sendAudioButtons'></div>`),
            	record: addButton(`role='record'`, `<svg x="0" y="0" aria-hidden="false" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" class="icon-GhnIRB icon-3D60ES da-icon"><path d="M11.999 14.942c2.001 0 3.531-1.53 3.531-3.531V4.35c0-2.001-1.53-3.531-3.531-3.531S8.469 2.35 8.469 4.35v7.061c0 2.001 1.53 3.531 3.53 3.531zm6.238-3.53c0 3.531-2.942 6.002-6.237 6.002s-6.237-2.471-6.237-6.002H3.761c0 4.001 3.178 7.297 7.061 7.885v3.884h2.354v-3.884c3.884-.588 7.061-3.884 7.061-7.885h-2z"></path></svg>`),
            	cancel: addButton(`role='cancel' style='display: none;'`, `<svg x="0" y="0" aria-hidden="false" width="24" height="24" viewBox="0 0 475.2 475.2" fill="currentColor" class="icon-GhnIRB icon-3D60ES da-icon"><path d="M405.6,69.6C360.7,24.7,301.1,0,237.6,0s-123.1,24.7-168,69.6S0,174.1,0,237.6s24.7,123.1,69.6,168s104.5,69.6,168,69.6s123.1-24.7,168-69.6s69.6-104.5,69.6-168S450.5,114.5,405.6,69.6z M386.5,386.5c-39.8,39.8-92.7,61.7-148.9,61.7s-109.1-21.9-148.9-61.7c-82.1-82.1-82.1-215.7,0-297.8C128.5,48.9,181.4,27,237.6,27s109.1,21.9,148.9,61.7C468.6,170.8,468.6,304.4,386.5,386.5z"></path><path d="M342.3,132.9c-5.3-5.3-13.8-5.3-19.1,0l-85.6,85.6L152,132.9c-5.3-5.3-13.8-5.3-19.1,0c-5.3,5.3-5.3,13.8,0,19.1l85.6,85.6l-85.6,85.6c-5.3,5.3-5.3,13.8,0,19.1c2.6,2.6,6.1,4,9.5,4s6.9-1.3,9.5-4l85.6-85.6l85.6,85.6c2.6,2.6,6.1,4,9.5,4c3.5,0,6.9-1.3,9.5-4c5.3-5.3,5.3-13.8,0-19.1l-85.4-85.6l85.6-85.6C347.6,146.7,347.6,138.2,342.3,132.9z"></path></svg>`),
            	pause: addButton(`role='pause' style='display: none;'`, `<svg x="0" y="0" aria-hidden="false" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" class="icon-GhnIRB icon-3D60ES da-icon"><path fill="currentColor" d="M0,14 L4,14 L4,0 L0,0 L0,14 L0,14 Z M8,0 L8,14 L12,14 L12,0 L8,0 L8,0 Z" transform="translate(6 5)"></path></svg>`),
            	play: addButton(`role='play' style='display: none;'`, `<svg style='height: 30px;width: 30px;color: #444;' x="0" y="0" aria-hidden="false" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" class="icon-GhnIRB icon-3D60ES da-icon"><polygon fill="currentColor" points="0 0 0 14 11 7" transform="translate(7 5)"></polygon></svg>`),
            	save: addButton(`role='save' style='display: none;'`, `<svg style="fill: transparent;border: 1px solid #444;border-radius: 590%;" x="0" y="0" aria-hidden="false" width="24" height="24" viewBox="0 0 512 512" fill="currentColor" class="icon-GhnIRB icon-3D60ES da-icon" enable-background="new 0 0 512 512"><path d="M504.1,256C504.1,119,393,7.9,256,7.9C119,7.9,7.9,119,7.9,256C7.9,393,119,504.1,256,504.1C393,504.1,504.1,393,504.1,256z" style="fill: transparent;"></path><path d="M392.6,172.9c-5.8-15.1-17.7-12.7-30.6-10.1c-7.7,1.6-42,11.6-96.1,68.8c-22.5,23.7-37.3,42.6-47.1,57c-6-7.3-12.8-15.2-20-22.3C176.7,244.2,152,229,151,228.4c-10.3-6.3-23.8-3.1-30.2,7.3c-6.3,10.3-3.1,23.8,7.2,30.2     c0.2,0.1,21.4,13.2,39.6,31.5c18.6,18.6,35.5,43.8,35.7,44.1c4.1,6.2,11,9.8,18.3,9.8c1.2,0,2.5-0.1,3.8-0.3c8.6-1.5,15.4-7.9,17.5-16.3c0.1-0.2,8.8-24.3,54.7-72.7c37-39.1,61.7-51.5,70.3-54.9c0.1,0,0.1,0,0.3,0c0,0,0.3-0.1,0.8-0.4c1.5-0.6,2.3-0.8,2.3-0.8c-0.4,0.1-0.6,0.1-0.6,0.1l0-0.1c4-1.7,11.4-4.9,11.5-5C393.3,196.1,397,184.1,392.6,172.9z"></path></svg>`),
            	send: addButton(`role='send' style='display: none;'`, `<svg x="0" y="0" aria-hidden="false" width="24" height="24" viewBox="0 0 448 448" fill="currentColor" class="icon-GhnIRB icon-3D60ES da-icon"><polygon fill='#444' points="0.213,32 0,181.333 320,224 0,266.667 0.213,416 448,224"></polygon></svg>`)
            };

            this.buttons.group.append(this.buttons.record);
            this.buttons.group.append(this.buttons.cancel);
            this.buttons.group.append(this.buttons.pause);
            this.buttons.group.append(this.buttons.play);
            this.buttons.group.append(this.buttons.save);
            this.buttons.group.append(this.buttons.send);

            buttons_.append(this.buttons.group);

            for(let k in this.tooltips){
                if(k in this.buttons){
                    this.tooltips[k].setTarget(this.buttons[k]);
                    this.tooltips[k].props.lastUpdate = 0;
                }
            }

            const plugin = this;

            
            this.buttons.record.addEventListener('click', _ => {
                if(!plugin.recordStart()){
                    Logger.warn("Cannot start recording");
                }
            });
            this.buttons.cancel.addEventListener('click', _ => {
                if(plugin.record.previewing == true){
                    plugin.recordReset();

                    plugin.setDisplay({all: 'none', record: ''});
                }
                else{
                    plugin.mediaInfo.notSave = true;
                    plugin.recordStop();
                }
            });
            this.buttons.pause.addEventListener('click', _ => plugin.recordPause());
            this.buttons.play.addEventListener('click', _ => plugin.recordResume());
            this.buttons.save.addEventListener('click', _ => plugin.recordStop());
            this.buttons.send.addEventListener('click', _ => {
                if(plugin.record.previewing == true){
                    if(plugin.record.channel){
                        sendAudio(plugin.record.channel.id, plugin.record.blob);

                        plugin.recordReset();
                        plugin.setDisplay({all: 'none', record: ''});
                    }
                }
                else plugin.recordStop();
            });
            if(!this.mediaInfo.ready || this.mediaInfo.error)
            	this.buttons.record.disabled = true;

            if(this.mediaInfo.ready && !this.mediaInfo.error && this.media instanceof MediaRecorder){
                const channel = DiscordAPI.currentChannel;

                if(this.record.previewing)
                    this.setDisplay({record: 'none', cancel: '', send: ''});
                
                else if(this.media.state != 'inactive'){
                    if(this.settings.preview)
                        this.setDisplay({record: 'none', cancel: '', save: ''});
                    else
                        this.setDisplay({record: 'none', cancel: '', send: ''});

                    if(typeof channel == 'object' && typeof this.record.channel == 'object' && channel.id != this.record.channel.id){
                        this.buttons.send.disabled = true;
                        this.buttons.save.disabled = true;
                    }
                    if(this.media.state == 'paused')
                        this.setDisplay({pause: 'none', play: ''});
                    else
                        this.setDisplay({pause: '', play: 'none'});
                }
                
            }
            return true;
        }
        addPanelRecording(){
            const data = `Recording in ${getChannelName()} (${getGuildName()})`;

            const panel = addPanel(`<div><svg class="flash-record" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="#FF0000" d="M504.1,256C504.1,119,393,7.9,256,7.9C119,7.9,7.9,119,7.9,256C7.9,393,119,504.1,256,504.1C393,504.1,504.1,393,504.1,256z"></path></svg> <input type="text" value="${data}" readonly="" style="width: 88%;line-height: 18px;font-size: 14px;"></div><input type="text" role='time' value="00:00:00 - 0 KB" readonly="" style="width: 100%;text-align: center;white-space: pre-wrap;">`, `id='SendAudio-RecordingInfo'`);

            if(panel instanceof Element){
            	panel.addClass('SendAudio-Info');
                this.panelInfo[0] = panel;
                this.panelInfo[1] = panel.querySelector('input[role=time]');

                this.tooltips.info.setText(data);
                this.tooltips.info.setTarget(panel);
                return true;
            }
            return false;
        }
        removePanelRecording(){
            if(this.panelInfo[0] instanceof Element)
                this.panelInfo[0].remove();

            this.panelInfo = [false, false];
        }

        setDisplay(values){
        	if(typeof values != 'object' || typeof this.buttons != 'object' || !(this.buttons.group instanceof Element))
        		return false;

        	if(values.all)
        		for(let key in this.buttons)
        			if(key != 'group' && this.buttons[key] instanceof Element)
        				this.buttons[key].style.display = values.all;

        	delete values.all;

        	for(let key in values)
        		if(key in this.buttons && this.buttons[key] instanceof Element)
        			this.buttons[key].style.display = values[key];
	
     		return true;
        }

        getSettingsPanel(){
            const settings = this.buildSettingsPanel();
            if(settings){
                settings.addListener((id, value) => {
                    if(id == 'devices'){
                        this.changeMedia();
                    }
                    else if(id == 'preview'){
                        if(this.media instanceof MediaRecorder && this.media.state != 'inactive'){
                            if(value)
                                this.setDisplay({save: '', send: 'none'});
                            else
                                this.setDisplay({save: 'none', send: ''});
                        }
                    }
                    else if(id == 'nitro'){
                        this.record.max_size = value ? 52428800 : 8388608;
                    }
                });
                return settings.getElement();
            }
            Logger.warn("Failed to display settings");
        }

        changeMedia(device=false, changing=false){
            const plugin = this;

            const change = () => {
                plugin.media = null;
                plugin.mediaInfo.ready = false;
                plugin.mediaInfo.error = false;

                navigator.mediaDevices.getUserMedia({audio: (device != false ? device : plugin.settings.devices)}).then(s => {
                    plugin.media = new MediaRecorder(s);
                    Logger.log("MediaRecorder started successfully");

                    plugin.media.addEventListener('dataavailable', e => plugin.onRecordingData(e.data));
                    plugin.media.addEventListener('start', _ => plugin.onRecordingStateChange(0));
                    plugin.media.addEventListener('stop', _ => plugin.onRecordingStateChange(1));
                    plugin.media.addEventListener('pause', _ => plugin.onRecordingStateChange(2));
                    plugin.media.addEventListener('resume', _ => plugin.onRecordingStateChange(3));

                    plugin.media.addEventListener('error', error => {
                        Logger.error('Recording error:', error);
                    });
                    plugin.mediaInfo.ready = true;
                    plugin.mediaInfo.error = false;
                    if(typeof plugin.buttons == 'object' && plugin.buttons.record instanceof Element)
                        plugin.buttons.record.disabled = false;

                }).catch(err => {
                    plugin.mediaInfo.ready = false;
                    plugin.mediaInfo.error = true;
                    if(typeof plugin.buttons == 'object' &&plugin.buttons.record instanceof Element)
                        plugin.buttons.record.disabled = true;

                    Logger.error("Failed to start MediaRecorder:", err.message);

                    if(!changing){
	                    Logger.log("Changing to the default");
	                    plugin.changeMedia('default', true);
					}
                });
            };

            if(this.media instanceof MediaRecorder){
                this.mediaInfo.notSave = true;
                if(this.media.state != 'inactive')
                    this.media.stop().then(_ => change()).catch(_ => change());
            }
            else{
                change();
            }
        }

        /* Record methods */
        recordStart(){
            if(this.media instanceof MediaRecorder){
                if(this.media.state == 'inactive'){
                    this.record.chunks = [];
                    this.record.size = 0;
                    this.record.time = 0;
                    this.media.start(1000);
                }
                return this.media.state == 'recording';
            }
            return false;
        }
        recordStop(){
            if(this.media instanceof MediaRecorder){
                if(this.media.state != 'inactive')
                    this.media.stop();

                return this.media.state == 'inactive';
            }
            return false;
        }
        recordPause(){
            if(this.media instanceof MediaRecorder){
                if(this.media.state == 'recording')
                    this.media.pause();

                return this.media.state == 'paused';
            }
            return false;
        }
        recordResume(){
            if(this.media instanceof MediaRecorder){
                if(this.media.state == 'paused')
                    this.media.resume();

                return this.media.state == 'recording';
            }
            return false;
        }
        recordReset(){
            this.record.chunks = [];
            this.record.time = 0;
            this.record.size = 0;
            this.record.notSave = false;
            this.record.blob = null;
            this.record.channel = null;
            this.record.previewing = false;
            this.record.limitStop = false;

            if(typeof this.buttons == 'object' && 'group' in this.buttons && this.buttons.group instanceof Element){
            	this.buttons.save.disabled = false;
            	this.buttons.send.disabled = false;
            }

            if(this.player != null)
            	this.player.close();
        }

        /* Record Event */
        onRecordingStateChange(new_state){
            //start
            switch(new_state){
                //start
                case 0:{
                    this.addPanelRecording();
                    this.record.channel = DiscordAPI.currentChannel;
                    if(this.settings.preview)
                        this.setDisplay({record: 'none', cancel: 'block', pause: 'block', save: 'block'});
                    else
                        this.setDisplay({record: 'none', cancel: 'block', pause: 'block', send: 'block'});
                    break;
                }
                //stop
                case 1:{
                    this.removePanelRecording();

                    if(this.mediaInfo.notSave){
                        this.mediaInfo.notSave = false;
                        this.setDisplay({all: 'none', record: ''});
                        this.recordReset();
                        return;
                    }
                    if(this.record.size > 0){

                        if(this.record.size > this.record.max_size){
                            let tempChunks = [];
                            let tempSize = 0;

                            for(let i = 0; i < this.record.chunks.length; ++i){
                                if(tempSize + this.record.chunks[i].size <= this.record.max_size){
                                    tempChunks.push(this.record.chunks[i]);
                                    tempSize += this.record.chunks[i].size;
                                }
                            }
                            this.record.chunks = tempChunks;
                            this.record.size = tempSize;
                        }

                        this.record.blob = new Blob(this.record.chunks, {type: this.settings.mimetype})
                        if(!this.settings.preview){
                            if(this.record.channel)
                                sendAudio(this.record.channel.id, this.record.blob);
                        }
                        else{
                            Logger.log("PREVIEW");
                            this.player = new DiscordPlayer();
                            this.player.setAudio(new Audio(URL.createObjectURL(this.record.blob)));
                            this.player.display('block');
                            this.record.previewing = true;
                            this.setDisplay({all: 'none', cancel: 'block', send: 'block'});
                            return;
                        }
                    }
                    this.recordReset();
                    this.setDisplay({all: 'none', record: ''});
                    break;
                }
                //pause
                case 2:{
                    this.setDisplay({play: '', pause: 'none'});
                    break;
                }
                //resume
                case 3:{
                    this.setDisplay({play: 'none', pause: ''});
                    break;
                }
                default:
                    break;
            }
            
        }
        onRecordingData(data){
            this.record.time ++;

            if(data.size > 0){
                if(this.record.size + data.size > this.record.max_size){
                    this.record.limitStop = true;
                    this.recordStop();
                    return;
                }
                this.record.chunks.push(data);
                this.record.size += data.size;
            }
            if(this.panelInfo[1] instanceof Element)
                this.panelInfo[1].value = `${convertToTime(this.record.time)} - ${convertData(this.record.size)}`;
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
