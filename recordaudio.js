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
