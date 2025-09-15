// Musical Repertoire Management App
class MusicApp {
    constructor() {
        this.songs = JSON.parse(localStorage.getItem('musicRepertoire')) || [];
        this.scores = JSON.parse(localStorage.getItem('musicScores')) || [];
        this.lyrics = JSON.parse(localStorage.getItem('musicLyrics')) || [];
        this.currentEditingSong = null;
        this.currentEditingScore = null;
        this.currentEditingLyrics = null;
        this.selectedNote = 'quarter';
        
        this.initializeEventListeners();
        this.showTab('repertorio');
        this.renderSongs();
        this.renderScores();
        this.renderLyrics();
    }

    initializeEventListeners() {
        // Tab navigation
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.showTab(e.target.dataset.tab);
            });
        });

        // Repertoire management
        document.getElementById('add-song-btn').addEventListener('click', () => {
            this.openSongModal();
        });

        document.getElementById('search-input').addEventListener('input', (e) => {
            this.filterSongs(e.target.value, document.getElementById('genre-filter').value);
        });

        document.getElementById('genre-filter').addEventListener('change', (e) => {
            this.filterSongs(document.getElementById('search-input').value, e.target.value);
        });

        // Song form
        document.getElementById('song-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveSong();
        });

        // Modal controls
        document.querySelectorAll('.close').forEach(closeBtn => {
            closeBtn.addEventListener('click', (e) => {
                this.closeModal(e.target.closest('.modal'));
            });
        });

        document.getElementById('cancel-btn').addEventListener('click', () => {
            this.closeModal(document.getElementById('song-modal'));
        });

        // Score editor
        document.getElementById('new-score-btn').addEventListener('click', () => {
            this.createNewScore();
        });

        document.getElementById('tempo').addEventListener('input', (e) => {
            document.getElementById('tempo-display').textContent = e.target.value + ' BPM';
        });

        document.querySelectorAll('.note-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.selectNote(e.target.dataset.note || e.target.closest('.note-btn').dataset.note);
            });
        });

        // Lyrics editor
        document.getElementById('new-lyrics-btn').addEventListener('click', () => {
            this.createNewLyrics();
        });

        document.querySelectorAll('.structure-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.insertLyricsStructure(e.target.dataset.structure);
            });
        });

        document.getElementById('save-lyrics-btn').addEventListener('click', () => {
            this.saveLyrics();
        });

        document.getElementById('preview-lyrics-btn').addEventListener('click', () => {
            this.previewLyrics();
        });

        // Click outside modal to close
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModal(e.target);
            }
        });
    }

    showTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.tab === tabName) {
                btn.classList.add('active');
            }
        });

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(tabName).classList.add('active');
    }

    // Repertoire Management
    openSongModal(song = null) {
        this.currentEditingSong = song;
        const modal = document.getElementById('song-modal');
        const modalTitle = document.getElementById('modal-title');
        const form = document.getElementById('song-form');

        if (song) {
            modalTitle.textContent = 'Editar Canción';
            this.populateSongForm(song);
        } else {
            modalTitle.textContent = 'Agregar Canción';
            form.reset();
        }

        modal.style.display = 'block';
    }

    populateSongForm(song) {
        document.getElementById('song-title').value = song.title;
        document.getElementById('song-artist').value = song.artist;
        document.getElementById('song-genre').value = song.genre;
        document.getElementById('song-key').value = song.key || '';
        document.getElementById('song-tempo').value = song.tempo || 120;
        document.getElementById('song-notes').value = song.notes || '';
    }

    saveSong() {
        const formData = {
            title: document.getElementById('song-title').value,
            artist: document.getElementById('song-artist').value,
            genre: document.getElementById('song-genre').value,
            key: document.getElementById('song-key').value,
            tempo: parseInt(document.getElementById('song-tempo').value),
            notes: document.getElementById('song-notes').value,
            dateAdded: this.currentEditingSong ? this.currentEditingSong.dateAdded : new Date().toISOString()
        };

        if (this.currentEditingSong) {
            // Update existing song
            const index = this.songs.findIndex(song => song.id === this.currentEditingSong.id);
            if (index !== -1) {
                this.songs[index] = { ...this.currentEditingSong, ...formData };
            }
        } else {
            // Add new song
            const newSong = {
                id: Date.now().toString(),
                ...formData
            };
            this.songs.push(newSong);
        }

        this.saveSongsToStorage();
        this.renderSongs();
        this.closeModal(document.getElementById('song-modal'));
        this.showMessage('Canción guardada exitosamente', 'success');
    }

    deleteSong(songId) {
        if (confirm('¿Estás seguro de que quieres eliminar esta canción?')) {
            this.songs = this.songs.filter(song => song.id !== songId);
            this.saveSongsToStorage();
            this.renderSongs();
            this.showMessage('Canción eliminada', 'success');
        }
    }

    filterSongs(searchTerm, genre) {
        const filtered = this.songs.filter(song => {
            const matchesSearch = !searchTerm || 
                song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                song.artist.toLowerCase().includes(searchTerm.toLowerCase()) ||
                song.genre.toLowerCase().includes(searchTerm.toLowerCase());
            
            const matchesGenre = !genre || song.genre === genre;
            
            return matchesSearch && matchesGenre;
        });

        this.renderSongs(filtered);
    }

    renderSongs(songsToRender = this.songs) {
        const songList = document.getElementById('song-list');
        
        if (songsToRender.length === 0) {
            songList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-music"></i>
                    <h3>No hay canciones en tu repertorio</h3>
                    <p>Agrega tu primera canción para empezar a gestionar tu repertorio musical</p>
                </div>
            `;
            return;
        }

        songList.innerHTML = songsToRender.map(song => `
            <div class="song-card">
                <h3>${this.escapeHtml(song.title)}</h3>
                <div class="artist">${this.escapeHtml(song.artist)}</div>
                <div class="details">
                    <span class="genre">${this.escapeHtml(song.genre)}</span>
                    <div class="actions">
                        <button onclick="app.openSongModal(app.songs.find(s => s.id === '${song.id}'))" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="app.deleteSong('${song.id}')" title="Eliminar">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                ${song.key ? `<div style="margin-top: 10px; color: #666;">Tonalidad: ${song.key}</div>` : ''}
                ${song.tempo ? `<div style="color: #666;">Tempo: ${song.tempo} BPM</div>` : ''}
                ${song.notes ? `<div style="margin-top: 10px; font-style: italic; color: #555;">${this.escapeHtml(song.notes)}</div>` : ''}
            </div>
        `).join('');
    }

    // Score Management
    createNewScore() {
        const newScore = {
            id: Date.now().toString(),
            title: 'Nueva Partitura',
            timeSignature: document.getElementById('time-signature').value,
            keySignature: document.getElementById('key-signature').value,
            tempo: parseInt(document.getElementById('tempo').value),
            measures: [],
            dateCreated: new Date().toISOString()
        };

        this.scores.push(newScore);
        this.currentEditingScore = newScore;
        this.saveScoresToStorage();
        this.renderScores();
        this.initializeStaff();
        this.showMessage('Nueva partitura creada', 'success');
    }

    initializeStaff() {
        const measuresContainer = document.getElementById('measures');
        measuresContainer.innerHTML = '';
        
        // Create initial measures
        for (let i = 0; i < 4; i++) {
            const measure = document.createElement('div');
            measure.className = 'measure';
            measure.style.cssText = `
                width: 200px;
                height: 150px;
                border-right: 2px solid #2d3748;
                position: relative;
                cursor: pointer;
            `;
            measure.addEventListener('click', (e) => this.addNoteToMeasure(e, i));
            measuresContainer.appendChild(measure);
        }
    }

    selectNote(noteType) {
        this.selectedNote = noteType;
        document.querySelectorAll('.note-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-note="${noteType}"]`).classList.add('active');
    }

    addNoteToMeasure(event, measureIndex) {
        const measure = event.currentTarget;
        const rect = measure.getBoundingClientRect();
        const y = event.clientY - rect.top;
        
        const note = document.createElement('div');
        note.className = 'note';
        note.style.cssText = `
            position: absolute;
            top: ${y}px;
            left: ${(measure.children.length * 30) + 10}px;
            width: 20px;
            height: 20px;
            background: #2d3748;
            border-radius: 50%;
            cursor: pointer;
        `;
        
        note.addEventListener('click', (e) => {
            e.stopPropagation();
            note.remove();
        });
        
        note.title = `${this.selectedNote} note - Click to remove`;
        measure.appendChild(note);
    }

    deleteScore(scoreId) {
        if (confirm('¿Estás seguro de que quieres eliminar esta partitura?')) {
            this.scores = this.scores.filter(score => score.id !== scoreId);
            this.saveScoresToStorage();
            this.renderScores();
            this.showMessage('Partitura eliminada', 'success');
        }
    }

    renderScores() {
        const scoreList = document.getElementById('score-list');
        
        if (this.scores.length === 0) {
            scoreList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-file-music"></i>
                    <h3>No hay partituras creadas</h3>
                    <p>Crea tu primera partitura para empezar a componer</p>
                </div>
            `;
            return;
        }

        scoreList.innerHTML = this.scores.map(score => `
            <div class="score-item">
                <h4>${this.escapeHtml(score.title)}</h4>
                <div class="meta">
                    ${score.timeSignature} - ${score.keySignature} - ${score.tempo} BPM
                </div>
                <div class="meta">
                    Creada: ${new Date(score.dateCreated).toLocaleDateString()}
                </div>
                <div class="actions">
                    <button onclick="app.editScore('${score.id}')" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="app.deleteScore('${score.id}')" title="Eliminar">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    editScore(scoreId) {
        const score = this.scores.find(s => s.id === scoreId);
        if (score) {
            this.currentEditingScore = score;
            document.getElementById('time-signature').value = score.timeSignature;
            document.getElementById('key-signature').value = score.keySignature;
            document.getElementById('tempo').value = score.tempo;
            document.getElementById('tempo-display').textContent = score.tempo + ' BPM';
            this.initializeStaff();
            this.showMessage('Partitura cargada para edición', 'info');
        }
    }

    // Lyrics Management
    createNewLyrics() {
        document.getElementById('lyrics-title').value = '';
        document.getElementById('lyrics-artist').value = '';
        document.getElementById('lyrics-genre').value = '';
        document.getElementById('lyrics-textarea').value = `[Verso 1]


[Coro]


[Verso 2]


[Coro]

`;
        this.currentEditingLyrics = null;
    }

    insertLyricsStructure(structure) {
        const textarea = document.getElementById('lyrics-textarea');
        const structureText = {
            verse: '\n[Verso]\n\n\n',
            chorus: '\n[Coro]\n\n\n',
            bridge: '\n[Puente]\n\n\n',
            intro: '\n[Intro]\n\n\n',
            outro: '\n[Outro]\n\n\n'
        };

        const cursorPos = textarea.selectionStart;
        const textBefore = textarea.value.substring(0, cursorPos);
        const textAfter = textarea.value.substring(cursorPos);
        
        textarea.value = textBefore + structureText[structure] + textAfter;
        textarea.focus();
        textarea.setSelectionRange(cursorPos + structureText[structure].length - 2, cursorPos + structureText[structure].length - 2);
    }

    saveLyrics() {
        const title = document.getElementById('lyrics-title').value.trim();
        const artist = document.getElementById('lyrics-artist').value.trim();
        const genre = document.getElementById('lyrics-genre').value;
        const content = document.getElementById('lyrics-textarea').value;

        if (!title) {
            this.showMessage('Por favor ingresa un título para la letra', 'error');
            return;
        }

        if (!content.trim()) {
            this.showMessage('Por favor escribe algo de contenido para la letra', 'error');
            return;
        }

        const lyricsData = {
            title,
            artist: artist || 'Artista desconocido',
            genre: genre || 'Sin género',
            content,
            dateCreated: this.currentEditingLyrics ? this.currentEditingLyrics.dateCreated : new Date().toISOString(),
            dateModified: new Date().toISOString()
        };

        if (this.currentEditingLyrics) {
            // Update existing lyrics
            const index = this.lyrics.findIndex(l => l.id === this.currentEditingLyrics.id);
            if (index !== -1) {
                this.lyrics[index] = { ...this.currentEditingLyrics, ...lyricsData };
            }
        } else {
            // Add new lyrics
            const newLyrics = {
                id: Date.now().toString(),
                ...lyricsData
            };
            this.lyrics.push(newLyrics);
            this.currentEditingLyrics = newLyrics;
        }

        this.saveLyricsToStorage();
        this.renderLyrics();
        this.showMessage('Letra guardada exitosamente', 'success');
    }

    deleteLyrics(lyricsId) {
        if (confirm('¿Estás seguro de que quieres eliminar esta letra?')) {
            this.lyrics = this.lyrics.filter(l => l.id !== lyricsId);
            this.saveLyricsToStorage();
            this.renderLyrics();
            this.showMessage('Letra eliminada', 'success');
        }
    }

    editLyrics(lyricsId) {
        const lyrics = this.lyrics.find(l => l.id === lyricsId);
        if (lyrics) {
            this.currentEditingLyrics = lyrics;
            document.getElementById('lyrics-title').value = lyrics.title;
            document.getElementById('lyrics-artist').value = lyrics.artist;
            document.getElementById('lyrics-genre').value = lyrics.genre;
            document.getElementById('lyrics-textarea').value = lyrics.content;
            this.showMessage('Letra cargada para edición', 'info');
        }
    }

    previewLyrics() {
        const content = document.getElementById('lyrics-textarea').value;
        if (!content.trim()) {
            this.showMessage('No hay contenido para mostrar en vista previa', 'error');
            return;
        }

        document.getElementById('lyrics-preview-content').textContent = content;
        document.getElementById('lyrics-preview-modal').style.display = 'block';
    }

    renderLyrics() {
        const lyricsList = document.getElementById('lyrics-list');
        
        if (this.lyrics.length === 0) {
            lyricsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-pen-fancy"></i>
                    <h3>No hay letras creadas</h3>
                    <p>Escribe tu primera letra para empezar a crear canciones</p>
                </div>
            `;
            return;
        }

        lyricsList.innerHTML = this.lyrics.map(lyrics => `
            <div class="lyrics-item">
                <h4>${this.escapeHtml(lyrics.title)}</h4>
                <div class="meta">
                    Artista: ${this.escapeHtml(lyrics.artist)}
                </div>
                <div class="meta">
                    Género: ${this.escapeHtml(lyrics.genre)}
                </div>
                <div class="meta">
                    Modificada: ${new Date(lyrics.dateModified).toLocaleDateString()}
                </div>
                <div class="actions">
                    <button onclick="app.editLyrics('${lyrics.id}')" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="app.deleteLyrics('${lyrics.id}')" title="Eliminar">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    // Utility Methods
    closeModal(modal) {
        modal.style.display = 'none';
        this.currentEditingSong = null;
    }

    showMessage(text, type = 'info') {
        // Remove existing messages
        const existingMessages = document.querySelectorAll('.message');
        existingMessages.forEach(msg => msg.remove());

        const message = document.createElement('div');
        message.className = `message ${type}`;
        message.textContent = text;

        const mainContent = document.querySelector('.main-content');
        mainContent.insertBefore(message, mainContent.firstChild);

        // Auto-remove message after 5 seconds
        setTimeout(() => {
            message.remove();
        }, 5000);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    saveSongsToStorage() {
        localStorage.setItem('musicRepertoire', JSON.stringify(this.songs));
    }

    saveScoresToStorage() {
        localStorage.setItem('musicScores', JSON.stringify(this.scores));
    }

    saveLyricsToStorage() {
        localStorage.setItem('musicLyrics', JSON.stringify(this.lyrics));
    }

    // Export/Import functionality
    exportData() {
        const data = {
            songs: this.songs,
            scores: this.scores,
            lyrics: this.lyrics,
            exportDate: new Date().toISOString()
        };

        const dataStr = JSON.stringify(data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `music-repertoire-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        this.showMessage('Datos exportados exitosamente', 'success');
    }

    importData(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                
                if (data.songs) this.songs = data.songs;
                if (data.scores) this.scores = data.scores;
                if (data.lyrics) this.lyrics = data.lyrics;
                
                this.saveSongsToStorage();
                this.saveScoresToStorage();
                this.saveLyricsToStorage();
                
                this.renderSongs();
                this.renderScores();
                this.renderLyrics();
                
                this.showMessage('Datos importados exitosamente', 'success');
            } catch (error) {
                this.showMessage('Error al importar datos: archivo no válido', 'error');
            }
        };
        reader.readAsText(file);
    }
}

// Initialize the app when the page loads
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new MusicApp();
    
    // Add some sample data if empty
    if (app.songs.length === 0) {
        app.songs = [
            {
                id: '1',
                title: 'Canción de Ejemplo',
                artist: 'Artista Demo',
                genre: 'rock',
                key: 'C',
                tempo: 120,
                notes: 'Esta es una canción de ejemplo para mostrar las funcionalidades de la aplicación.',
                dateAdded: new Date().toISOString()
            }
        ];
        app.saveSongsToStorage();
        app.renderSongs();
    }
});

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl+S to save in lyrics editor
    if (e.ctrlKey && e.key === 's' && document.getElementById('letras').classList.contains('active')) {
        e.preventDefault();
        app.saveLyrics();
    }
    
    // Ctrl+N for new items
    if (e.ctrlKey && e.key === 'n') {
        e.preventDefault();
        const activeTab = document.querySelector('.tab-content.active').id;
        switch (activeTab) {
            case 'repertorio':
                app.openSongModal();
                break;
            case 'partituras':
                app.createNewScore();
                break;
            case 'letras':
                app.createNewLyrics();
                break;
        }
    }
    
    // ESC to close modals
    if (e.key === 'Escape') {
        const openModals = document.querySelectorAll('.modal[style*="block"]');
        openModals.forEach(modal => {
            app.closeModal(modal);
        });
    }
});