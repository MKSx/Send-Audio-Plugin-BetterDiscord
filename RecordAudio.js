class RecordAudio{
    constructor(){
        this.record = null;
        this.audioChunks = [];
        this.audioBlob = null;
        this.audioURL = null;
        this.audio = null;
        this.stoped = false;
        this.started = false;

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
        if(this.record != null && this.started && !this.stoped){
            this.record.addEventListener('stop', () => {
                this.audioBlob = new Blob(this.audioChunks, {type: 'audio/ogg'});
                this.audioURL = URL.createObjectURL(this.audioBlob);

                this.audio = new Audio(this.audioURL);
                this.stoped = true;
            });
            this.record.stop();
            return true;
        }
        return false;
    }
    play(){
        if(this.stoped){
            this.audio.play();
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
            this.audioURL = null;
            this.audio = null;
            this.stoped = false;
            this.started = false;
        }
    }
}
