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

function adminReviewsApp() {
    return {
        reviews: [],
        searchQuery: '',
        isEditModalOpen: false,
        editId: null,
        editForm: {
            rating: 5,
            comment: ''
        },
        init() {
            auth.onAuthStateChanged(user => {
                if (!user) {
                    alert("กรุณาเข้าสู่ระบบในฐานะ Admin");
                    window.location.href = 'auth.html';
                } else {
                    this.verifyAdminPermission(user.uid);
                }
            });
        },
        verifyAdminPermission(uid) {
            db.collection("users").doc(uid).get().then(doc => {
                if (doc.exists) {
                    const role = doc.data().role || 'user';
                    if (role === 'admin' || role === 'superadmin') {
                        this.fetchReviews();
                    } else {
                        alert("คุณไม่มีสิทธิ์เข้าถึงหน้านี้");
                        window.location.href = 'index.html';
                    }
                } else {
                    window.location.href = 'auth.html';
                }
            }).catch(err => console.error("Permission check error:", err));
        },
        fetchReviews() {
            db.collection("reviews").onSnapshot(snapshot => {
                this.reviews = snapshot.docs.map(doc => {
                    const data = doc.data();
                    let dateStr = '-';
                    if (data.createdAt && data.createdAt.seconds) {
                        dateStr = new Date(data.createdAt.seconds * 1000).toLocaleDateString('th-TH');
                    }
                    return {
                        id: doc.id,
                        mangaId: String(data.mangaId || ''),
                        mangaTitle: String(data.mangaTitle || 'ไม่ระบุชื่อเรื่อง'),
                        userEmail: String(data.userEmail || 'ไม่ระบุตัวตน'),
                        rating: Number(data.rating || 5),
                        comment: String(data.comment || ''),
                        createdAt: dateStr
                    };
                });
            }, err => console.error("Fetch reviews error:", err));
        },
        get filteredReviews() {
            const query = this.searchQuery.trim().toLowerCase();
            if (!query) return this.reviews;
            return this.reviews.filter(item =>
                item.mangaTitle.toLowerCase().includes(query) ||
                item.userEmail.toLowerCase().includes(query) ||
                item.comment.toLowerCase().includes(query)
            );
        },
        openEditModal(review) {
            this.editId = review.id;
            this.editForm.rating = review.rating;
            this.editForm.comment = review.comment;
            this.isEditModalOpen = true;
        },
        closeEditModal() {
            this.isEditModalOpen = false;
            this.editId = null;
            this.editForm = { rating: 5, comment: '' };
        },
        saveEdit() {
            if (!this.editId) return;

            db.collection("reviews").doc(this.editId).update({
                rating: Number(this.editForm.rating),
                comment: String(this.editForm.comment).trim(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }).then(() => {
                alert("อัปเดตบทวิเคราะห์/รีวิวเรียบร้อยแล้ว!");
                this.closeEditModal();
            }).catch(err => {
                alert("เกิดข้อผิดพลาดในการบันทึก: " + err.message);
            });
        },
        deleteReview(id) {
            if (confirm("คุณแน่ใจหรือไม่ว่าต้องการลบรีวิวนี้?")) {
                db.collection("reviews").doc(id).delete().then(() => {
                    alert("ลบรีวิวเรียบร้อยแล้ว");
                }).catch(err => {
                    alert("เกิดข้อผิดพลาดในการลบ: " + err.message);
                });
            }
        }
    }
}