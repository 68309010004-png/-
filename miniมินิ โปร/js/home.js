const firebaseConfig = {
    apiKey: "AIzaSyDrlE3BW6DL729ltElYPRlruFCoig-Ibgc",
    authDomain: "m-fkjdshujfbdou.firebaseapp.com",
    projectId: "m-fkjdshujfbdou",
    storageBucket: "m-fkjdshujfbdou.firebasestorage.app",
    messagingSenderId: "1081777451090",
    appId: "1:1081777451090:web:1ec56a4455700307512f8b"
};

if (!firebase.apps.length) { firebase.initializeApp(firebaseConfig); }
const auth = firebase.auth();
const db = firebase.firestore();

function homeApp() {
    return {
        mangas: [],
        favoriteIds: [],
        currentUser: null,
        userRole: 'user',
        loading: true,
        searchQuery: '',
        selectedCategory: 'All',
        showModal: false,
        selectedManga: null,

        init() {
            auth.onAuthStateChanged(user => {
                this.currentUser = user;
                if (user) {
                    this.checkUserRole(user.uid);
                    this.fetchFavorites(user.uid);
                } else {
                    window.location.href = 'auth.html';
                }
            });
            this.fetchMangas();
        },

        checkUserRole(uid) {
            db.collection("users").doc(uid).get().then(doc => {
                if (doc.exists) {
                    this.userRole = doc.data().role || 'user';
                }
            });
        },

        fetchMangas() {
            this.loading = true;
            db.collection("mangas").onSnapshot(snapshot => {
                this.mangas = snapshot.docs.map(doc => {
                    const data = doc.data();
                    let cat = data.category;
                    if (Array.isArray(cat)) cat = cat[0] || 'Action';

                    return {
                        id: doc.id,
                        title: String(data.title || ''),
                        author: String(data.author || ''),
                        category: String(cat || 'Action'),
                        buyUrl: String(data.buyUrl || ''),
                        cover: String(data.cover || ''),
                        synopsis: String(data.synopsis || '')
                    };
                });
                this.loading = false;
            });
        },

        fetchFavorites(uid) {
            db.collection("users").doc(uid).collection("favorites").onSnapshot(snapshot => {
                this.favoriteIds = snapshot.docs.map(doc => doc.id);
            });
        },

        isFavorite(mangaId) {
            if (!Array.isArray(this.favoriteIds)) return false;
            return this.favoriteIds.includes(String(mangaId));
        },

        toggleFavorite(manga) {
            if (!this.currentUser || !manga || !manga.id) return;
            
            const mangaIdStr = String(manga.id);
            const favRef = db.collection("users").doc(this.currentUser.uid).collection("favorites").doc(mangaIdStr);

            if (this.isFavorite(mangaIdStr)) {
                favRef.delete().catch(err => console.error("Remove fav error:", err));
            } else {
                favRef.set({
                    title: String(manga.title || ''),
                    cover: String(manga.cover || ''),
                    addedAt: firebase.firestore.FieldValue.serverTimestamp()
                }).catch(err => console.error("Add fav error:", err));
            }
        },

        get filteredMangas() {
            if (!Array.isArray(this.mangas)) return [];
            
            const query = String(this.searchQuery || '').trim().toLowerCase();

            return this.mangas.filter(manga => {
                const titleStr = String(manga.title || '').toLowerCase();
                const authorStr = String(manga.author || '').toLowerCase();

                const matchesSearch = !query || titleStr.includes(query) || authorStr.includes(query);
                const matchesCategory = this.selectedCategory === 'All' || manga.category === this.selectedCategory;
                
                return matchesSearch && matchesCategory;
            });
        },

        openModal(manga) {
            this.selectedManga = manga;
            this.showModal = true;
        },

        closeModal() {
            this.showModal = false;
            this.selectedManga = null;
        },

        logout() {
            auth.signOut().then(() => {
                window.location.href = 'auth.html';
            });
        }
    }
}