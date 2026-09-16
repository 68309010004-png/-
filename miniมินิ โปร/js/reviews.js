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

function reviewsApp() {
    return {
        mangaId: null,
        manga: { title: '', author: '', cover: '' },
        reviews: [],
        currentUser: null,
        loading: true,
        submitting: false,
        hoverRating: 0,
        form: {
            rating: 5,
            comment: ''
        },

        init() {
            const urlParams = new URLSearchParams(window.location.search);
            this.mangaId = urlParams.get('id');

            if (!this.mangaId) {
                alert("ไม่พบรหัสมังงะที่ระบุ");
                window.location.href = 'index.html';
                return;
            }

            auth.onAuthStateChanged(user => {
                this.currentUser = user;
                if (!user) {
                    alert("กรุณาเข้าสู่ระบบก่อนใช้งาน");
                    window.location.href = 'auth.html';
                } else {
                    this.fetchMangaData();
                    this.fetchReviews();
                }
            });
        },

        fetchMangaData() {
            db.collection("mangas").doc(this.mangaId).get().then(doc => {
                if (doc.exists) {
                    this.manga = { id: doc.id, ...doc.data() };
                } else {
                    alert("ไม่พบข้อมูลมังงะเรื่องนี้");
                    window.location.href = 'index.html';
                }
                this.loading = false;
            }).catch(err => {
                console.error("Error fetching manga:", err);
                this.loading = false;
            });
        },

        fetchReviews() {
            db.collection("reviews")
                .where("mangaId", "==", this.mangaId)
                .onSnapshot(snapshot => {
                    this.reviews = snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }));
                }, err => console.error("Error fetching reviews:", err));
        },

        get avgRating() {
            if (this.reviews.length === 0) return "0.0";
            const sum = this.reviews.reduce((acc, curr) => acc + Number(curr.rating || 0), 0);
            return (sum / this.reviews.length).toFixed(1);
        },

        submitReview() {
            if (!this.currentUser) return;
            if (!this.form.comment.trim()) {
                alert("กรุณากรอกข้อความรีวิว");
                return;
            }

            this.submitting = true;
            const reviewData = {
                mangaId: this.mangaId,
                userId: this.currentUser.uid,
                userEmail: this.currentUser.email,
                rating: Number(this.form.rating),
                comment: String(this.form.comment).trim(),
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            db.collection("reviews").add(reviewData).then(() => {
                this.form.comment = '';
                this.form.rating = 5;
                this.submitting = false;
                alert("บันทึกรีวิวเรียบร้อยแล้ว!");
            }).catch(err => {
                this.submitting = false;
                alert("เกิดข้อผิดพลาด: " + err.message);
            });
        },

        deleteReview(reviewId) {
            if (confirm("คุณต้องการลบรีวิวนี้ใช่หรือไม่?")) {
                db.collection("reviews").doc(reviewId).delete().then(() => {
                    alert("ลบรีวิวเรียบร้อยแล้ว");
                }).catch(err => alert("เกิดข้อผิดพลาดในการลบ: " + err.message));
            }
        },

        formatDate(timestamp) {
            if (!timestamp) return 'เมื่อสักครู่';
            const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
            return date.toLocaleDateString('th-TH', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        }
    }
}