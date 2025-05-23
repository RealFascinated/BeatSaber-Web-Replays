AFRAME.registerComponent('intro-skip', {
	schema: {
		enabled: {default: true},
		difficulty: {type: 'string'},
	},

	init: function () {
		this.songControls = this.el.sceneEl.components['song-controls'];
		this.song = this.songControls.song;
		this.settings = this.el.sceneEl.components.settings;

		const skipIntroButton = document.getElementById('skipIntro');
		this.skipIntroButton = skipIntroButton;
		let skipIntroHanler = () => {
			if (skipIntroButton.classList.contains('intro')) {
				this.songControls.seek(this.introSkipTime);
			} else if (skipIntroButton.classList.contains('outro')) {
				this.songControls.seek(this.outroSkipTime);
			}

			skipIntroButton.style.display = 'none';
			skipIntroButton.classList = [];
		};

		skipIntroButton.addEventListener('click', () => {
			skipIntroHanler();
		});
		this.el.addEventListener('challengeloadend', evt => {
			this.beatmaps = evt.detail.beatmaps;
			this.beatData = this.beatmaps[evt.detail.mode][this.data.difficulty || evt.detail.difficulty];

			this.bpm = evt.detail.info._beatsPerMinute;
		});

		const analyser = document.getElementById('audioAnalyser');
		analyser.addEventListener('audioanalyserbuffersource', evt => {
			this.readMap(evt.detail.buffer.duration);
		});

		document.addEventListener('keydown', e => {
			if (e.keyCode === 73) {
				// i
				skipIntroHanler();
			}
		});
	},

	readMap: function (songDuration) {
		var firstObjectTime = songDuration;
		var lastObjectTime = -1.0;

		const notes = this.beatData._notes;
		for (let i = 0; i < notes.length; ++i) {
			const noteTime = notes[i]._songTime;
			if (noteTime < firstObjectTime) firstObjectTime = noteTime;
			if (noteTime > lastObjectTime) lastObjectTime = noteTime;
		}

		// Walls.
		const obstacles = this.beatData._obstacles;
		for (let i = 0; i < obstacles.length; ++i) {
			const obstacle = obstacles[i];
			const noteTime = obstacle._songTime;

			if (!(obstacle._lineIndex == 0 && obstacle._width == 1) && !(obstacle._lineIndex == 3 && obstacle._width == 1)) {
				if (noteTime < firstObjectTime) firstObjectTime = noteTime;
				if (noteTime > lastObjectTime) lastObjectTime = noteTime;
			}
		}

		if (firstObjectTime > 5) {
			this.introSkipTime = firstObjectTime - 2;
		}
		if (songDuration - lastObjectTime >= 5) {
			this.outroSkipTime = songDuration - 1.5;
			this.lastObjectSkipTime = lastObjectTime + 0.5;
		}
	},

	tick: function () {
		let button = this.skipIntroButton;
		const song = this.song;
		if (this.introSkipTime && song.isPlaying && song.getCurrentTime() <= this.introSkipTime) {
			if (this.settings.settings.autoSkipIntro) {
				this.songControls.seek(this.introSkipTime);
			} else {
				button.style.display = 'block';
				button.classList = ['intro'];
				button.innerHTML = 'Skip intro (i)';
			}
		} else if (
			this.lastObjectSkipTime &&
			song.isPlaying &&
			song.getCurrentTime() >= this.lastObjectSkipTime &&
			song.getCurrentTime() < this.outroSkipTime
		) {
			if (this.settings.settings.autoSkipOutro) {
				this.songControls.seek(this.outroSkipTime);
			} else {
				button.style.display = 'block';
				button.classList = ['outro'];
				button.innerHTML = 'Skip outro (i)';
			}
		} else if (button.classList.length) {
			button.style.display = 'none';
			button.classList = [];
		}
	},
});
