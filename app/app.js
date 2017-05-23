const MUSIC_PLAYER = (function() {
    let instance = null;

    class MusicPlayer {
        constructor() {
            if (!instance) {
                instance = this;
            }

            this.scrollConst = 5;
            this.firstSongTimePassed = '00:00:00';
            this.fullSize = 100;



            this.key = {
                ENTER: 13
            };

            this.TimeMs = {
                SECOND: 1000,
                MINUTE: 60 * 1000,
                HOUR: 60 * 60 * 1000
            };

            this.player = {
                $player: $('audio'),
            	song: null,
                src: null,
            	songDuration: 0,
            	songTimePassed: 0,
            	playInterval: null,
            	reset: function() {
            		this.songTimePassed = 0;
                    this.song = null;
                    this.songDuration = 0;
                    this.$player[0].src = '';
            		if (this.playInterval != null) {
            			clearInterval(this.playInterval);
            		}

            		this.playInterval = null;
            	}
            }

            return instance;
        }

        createList(songs) {
            if (songs.length === 0) {
                return this.createEmptyListItem();
            }

            this.showPlayer();

            const $ul = $('<ul />');

            for(let song of songs) {
                let $li = this.createListItem(song);

                $li.appendTo($ul);
            }

            $('#playlist').empty();
            $ul.appendTo($('#playlist').eq(0));
        }

        createListItem(song) {
            let songName = song.album.artists[0].name + ' - ' + song.name;
            let songDuration = song.duration_ms;
            let songUrl = song.preview_url;

            const $li = $('<li/>', {
                'data-track': songUrl
            });

            const $spanDuration = $('<span />', {
                'class': 'duration',
                text: this.formatDuration(songDuration)
            });

            const $spanName = $('<span />', {
                'class': 'name',
                text: songName
            });

            $spanName.appendTo($li);

            $spanDuration.appendTo($li);

            return $li;
        }

        createEmptyListItem() {
            this.hiddenPlayer()
            $('#playlist').empty();
            alert('No results! Please try again!');
        }

        showPlayer() {
            $('#player').removeClass('hidden');
            $('#nowPlaying').removeClass('hidden');
            $('#playlist').removeClass('hidden');
        }

        hiddenPlayer() {
            $('#player').addClass('hidden');
            $('#nowPlaying').addClass('hidden');
            $('#playlist').addClass('hidden');
        }

        unselectedSong() {
            if ($('li.selected')[0]) {
                $('li.selected .play-now').remove()
                $('li.selected').removeClass('selected');
            }
        }

        selectSong(e) {
            this.unselectedSong();
            this.clearNowPlaying();
            this.player.reset();

            const $li = $(e.currentTarget);

            $li.addClass('selected');

            this.play($li);
        }

        selectFirstSong() {
            let $li;

            this.clearNowPlaying();
            this.player.reset();

            if (!$('#playlist ul')) {
                return alert('Please first search for a song!')
            }
            $li = $('#playlist ul li:first-child');
            $li.addClass('selected');
            return $li;
        }

        removeSelectClass() {
            while ($('.play-controllers span.selected')[0]) {
                $('.play-controllers span.selected').removeClass('selected');
            }
        }

        setSong() {
            this.player.song = $('li.selected .name').html();
            this.player.songDuration = $('li.selected .duration').html();
            this.player.$player[0].src = $('li.selected').data('track');
        }

        createNowPlaying(li) {
            const $spanPlayNow = $('<span />', {
                'class': 'fa fa-play play-now'
            });

            $spanPlayNow.appendTo(li);

            $('#songDuration').html(this.player.songDuration);
            $('#songTitle').html(this.player.song);
            $('#songTimePassed').html(this.player.songTimePassed);
            if (this.player.songTimePassed === 0) {
                $('#songTimePassed').html(this.firstSongTimePassed);
            }

            this.handleProgress();
        }

        clearNowPlaying() {
            this.unselectedSong();
            $('#songDuration').html('');
            $('#songTitle').html('');
            $('#songTimePassed').html('');
            $('#seekbar').width('0%');
        }

        formatDuration(duration) {
            let hours = Math.floor(duration / this.TimeMs.HOUR);
            let minutes = Math.floor(duration/this.TimeMs.MINUTE)%60;
            let seconds = Math.floor(duration/this.TimeMs.SECOND)%60;

            if (hours >= 0 && hours < 10) {
                hours = '0' + hours;
            }

            if (minutes >= 0 && minutes < 10) {
                minutes = '0' + minutes;
            }

            if (seconds >= 0 && seconds < 10) {
                seconds = '0' + seconds;
            }

            return `${hours}:${minutes}:${seconds}`;

        }

        onTimeProgress() {
        	let html = this.formatDuration(this.TimeMs.SECOND * this.player.songTimePassed);
        	$('#songTimePassed').html(html);
        }

        onProgress() {
            let outerSeekbar = $('#outerSeekbar');
        	let seekbar = $('#seekbar');
        	this.player.songTimePassed++;
        	let percent = Math.round(this.player.songTimePassed/ (this.player.$player[0].duration / this.fullSize ));
            seekbar.width(percent  + '%');
        }

        handleProgress() {
            let self = this;
            this.player.playInterval = setInterval(function() {
                self.nextSong()
                self.onProgress();
                self.onTimeProgress();
            }, this.TimeMs.SECOND)
        }

        seekbarEvents(e) {
            let seekbar = $('#outerSeekbar');
            let length = seekbar.outerWidth();
            let clickX = e.offsetX;

            let percent = clickX / (length / this.fullSize);
            let seconds = (this.player.$player[0].duration / this.fullSize) * percent;

            this.player.songTimePassed = seconds;
            this.player.$player[0].currentTime = seconds;
        }

        playControllers(e) {
            let controller = $(e.currentTarget);
            this.removeSelectClass();

            if (controller.hasClass('play')){
                this.play();
            }
            if (controller.hasClass('pause')){
                controller.addClass('selected');
                this.pause();
            }
            if (controller.hasClass('stop')){
                controller.addClass('selected');
                this.stop();
            }
            if (controller.hasClass('forward')){
                this.forward();
            }
            if (controller.hasClass('fast-forward')){
                this.fastForward();
            }
            if (controller.hasClass('backward')){
                this.backward();
            }
            if (controller.hasClass('fast-backward')){
                this.fastBackward();
            }


        }

        play(li, controller) {
            if (this.playPausedSong()) {
                return;
            }
            let $li = li;
            if (!$li ) {
                $li = this.selectFirstSong();
            }
            this.removeSelectClass();
            $('.play-controllers span.play').addClass('selected');
            this.setSong();
            this.createNowPlaying($li);
            this.player.$player[0].src = $($li).data('track');
            this.player.$player[0].load();
            this.player.$player[0].play();
        }

        pause() {
            this.player.$player[0].pause();
            $('.selected .fa-play').removeClass('fa-play').addClass('fa-pause');
            clearInterval(this.player.playInterval);
        }

        stop() {
            this.clearNowPlaying();
            this.player.reset();
        }

        forward() {
            if (!this.player.songTimePassed + this.scrollConst >= this.player.$player[0].duration) {
                this.player.$player[0].currentTime = this.player.$player[0].duration;
                return this.player.songTimePassed = this.player.$player[0].duration;

            }
            this.player.songTimePassed += this.scrollConst;
            this.player.$player[0].currentTime += this.scrollConst;
        }

        fastForward() {
            let li = $('li.selected');
            let nextLi = li.next();

            if(nextLi[0]) {
                this.clearNowPlaying();
                this.player.reset();
                nextLi.addClass('selected');
                return this.play(nextLi);

            }
            this.play();
        }

        backward() {
            if (!this.player.songTimePassed - this.scrollConst < 0) {
                this.player.$player[0].currentTime = 0;
                return this.player.songTimePassed = 0;
            }
            this.player.songTimePassed -= this.scrollConst;
            this.player.$player[0].currentTime -= this.scrollConst;
        }

        fastBackward() {
            let li = $('li.selected');
            let prevLi = li.prev();

            if(prevLi[0]) {
                this.clearNowPlaying();
                this.player.reset();
                prevLi.addClass('selected');
                return this.play(prevLi);
            }
            this.play();
        }

        playPausedSong() {
            if($('li.selected span.fa-pause')[0]) {
                this.handleProgress();
                return this.player.$player[0].play();
            }
        }

        nextSong() {
            if(this.player.songTimePassed >= Math.floor(this.player.$player[0].duration)) {
                this.fastForward();
            }
        }

        volumeControllers(e) {
            let controller = $(e.currentTarget);
            let muteButton = $('.volume-off');

            if (controller.hasClass('volume-up')){
                this.volumeUp(muteButton, controller);
            }
            if (controller.hasClass('volume-down')){
                this.volumeDown(muteButton);
            }
            if (controller.hasClass('volume-off')){
                this.mute(muteButton)
            }
        }

        volumeUp(muteButton, controller) {
            let volume = this.player.$player[0].volume;

            if(this.player.$player[0].volume >= 1) {
                return alert('Maximum Volume Size!')
            }
            if (muteButton.hasClass('selected')){
                muteButton.removeClass('selected');
            }

            this.player.$player[0].volume = +volume.toFixed(1) + 0.1;
        }

        volumeDown(muteButton) {
            let volume = this.player.$player[0].volume;

            if(this.player.$player[0].volume <= 0) {
                return this.mute(muteButton);
            }
            this.player.$player[0].volume = +volume.toFixed(1) - 0.1;
        }

        mute(muteButton) {
            muteButton.addClass('selected');
            this.player.$player[0].volume = 0;
            alert('Minimum Volume Size!');
        }

        search(query, type, self) {
            let arr = Array.from(type);
            arr.push('track');

            $.ajax({
                url: 'https://api.spotify.com/v1/search',
                method: 'GET',
                data: {
                    q: query,
                    type: arr.join(',')
                },
                success: function(result) {
                    self.createList(result.tracks.items);
                },
                error: function(err) {
                    console.log(err);
                }
            });
        }

        getSearchField(self) {
            let searchField = $('#search').eq(0).val();

            if (searchField) {

                let type = $('option:selected').map(function(option) {
                    return $('option:selected').eq(option).val();
                });

                self.search(searchField, type, self);
            }
        }

        bindEvents() {
            let self = this;

            $('input').on('keyup', function(e) {

                if (e.which === self.key.ENTER) {
                    self.getSearchField(self);
                }

            });

            $('input#search').on('click', function(e) {
                $(this).val('')
            });

            $('input[type=button]').on('click', function(e) {
                self.getSearchField(self);
            });

            $('#playlist').on('click', 'li', function(e) {
                self.selectSong(e);
            });

            $('.volume-controllers').on('click', 'span', function(e) {
                self.volumeControllers(e);
            });

            $('.play-controllers').on('click', 'span', function(e) {
                self.playControllers(e);
            });

            $('#outerSeekbar').on('click', function(e) {
                self.seekbarEvents(e);
            });

        }
    }


    let init = function() {
        let musicPlayer = new MusicPlayer();
        musicPlayer.bindEvents();
    }

    return {
        init: init
    }

})();
