document.addEventListener('alpine:init', () => {
    Alpine.data('favoritesApp', () => ({
        userEmail: '',
        userRole: 'user',
        userId: null, // เก็บ UID ไว้ใช้งานทั่วทั้งคอมโพเนนต์
        favorites: [],
        searchQuery: '',
        selectedManga: null,

        init() {
            // เช็กสถานะการล็อกอิน
            auth.onAuthStateChanged(async (user) => {
                if (user) {
                    this.userId = user.uid;
                    this.userEmail = user.email;
                    await this.fetchUserRole(user.uid);
                    this.loadFavorites(user.uid);
                } else {
                    window.location.href = 'auth.html';
                }
            });
        },

        async fetchUserRole(uid) {
            try {
                const doc = await db.collection('users').doc(uid).get();
                if (doc.exists) {
                    this.userRole = doc.data().role || 'user';
                }
            } catch (err) {
                console.error("Error fetching user role:", err);
            }
        },

        loadFavorites(uid) {
            // ดึงข้อมูล Realtime จาก subcollection 'favorites'
            db.collection('users').doc(uid).collection('favorites').onSnapshot(async (favSnap) => {
                if (favSnap.empty) {
                    this.favorites = [];
                    return;
                }

                // ดึงข้อมูลมังงะจากคอลเลกชัน 'mangas' (มี s)
                const fetchPromises = favSnap.docs.map(async (favDoc) => {
                    const mangaId = favDoc.id;
                    const mangaDoc = await db.collection('mangas').doc(mangaId).get();
                    
                    if (mangaDoc.exists) {
                        const data = mangaDoc.data();
                        return { 
                            id: mangaDoc.id, 
                            title: data.title || '',
                            author: data.author || '',
                            cover: data.cover || data.coverUrl || '',
                            synopsis: data.synopsis || '',
                            buyUrl: data.buyUrl || data.affiliateUrl || ''
                        };
                    } else {
                        // กรณีมังงะถูกลบออกจากระบบหลักไปแล้ว แต่ยังมีค้างในคลังโปรด
                        const data = favDoc.data();
                        return {
                            id: favDoc.id,
                            title: data.title || '',
                            author: data.author || '',
                            cover: data.cover || '',
                            synopsis: data.synopsis || '',
                            buyUrl: data.buyUrl || ''
                        };
                    }
                });

                const results = await Promise.all(fetchPromises);
                this.favorites = results.filter(item => item !== null);
            }, (err) => {
                console.error("Error listening to favorites:", err);
            });
        },

        get filteredFavorites() {
            if (!this.searchQuery.trim()) return this.favorites;
            const query = this.searchQuery.toLowerCase();
            return this.favorites.filter(manga => 
                (manga.title && manga.title.toLowerCase().includes(query)) || 
                (manga.author && manga.author.toLowerCase().includes(query))
            );
        },

        async removeFavorite(mangaId) {
            if (!this.userId || !mangaId) return;

            try {
                const mangaIdStr = String(mangaId);
                
                // ลบออกจาก Firestore ด้วยไวยากรณ์ v8 Compat
                await db.collection('users').doc(this.userId).collection('favorites').doc(mangaIdStr).delete();
                
                // ตัดรายการออกจากหน้าจอทันที
                this.favorites = this.favorites.filter(manga => String(manga.id) !== mangaIdStr);
            } catch (err) {
                console.error("Error removing favorite:", err);
                alert("เกิดข้อผิดพลาดในการลบรายการโปรด: " + err.message);
            }
        },

        openModal(manga) {
            this.selectedManga = manga;
        },

        closeModal() {
            this.selectedManga = null;
        },

        logout() {
            auth.signOut().then(() => {
                window.location.href = 'auth.html';
            });
        }
    }));
});