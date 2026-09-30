// Script để seed dữ liệu mẫu vào Firestore với profile chi tiết
// Chạy script này trong Browser Console sau khi đã load Firebase

async function seedSampleData() {
    try {
        console.log('🌱 Bắt đầu seed dữ liệu mẫu...');
        
        // Seed sample members với profile chi tiết
        const members = [
            {
                name: 'GS. TS. Nguyễn Văn A',
                nickname: 'Prof. Van A Nguyen',
                role: 'Trưởng nhóm nghiên cứu',
                avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&crop=face',
                googleScholar: 'https://scholar.google.com/citations?user=example1',
                orcid: 'https://orcid.org/0000-0000-0000-0001',
                researchInterests: [
                    'Blockchain Technology',
                    'Distributed Systems',
                    'Cryptocurrency',
                    'Smart Contracts',
                    'IoT Security'
                ],
                bio: 'Giáo sư với hơn 15 năm kinh nghiệm trong lĩnh vực blockchain và bảo mật mạng. Đã công bố hơn 80 bài báo khoa học trên các tạp chí uy tín quốc tế.',
                education: [
                    'Tiến sĩ Khoa học Máy tính - MIT (2008)',
                    'Thạc sĩ Mạng máy tính - Stanford (2005)',
                    'Cử nhân CNTT - ĐH Bách khoa HN (2003)'
                ],
                achievements: [
                    'Best Paper Award - IEEE ICC 2024',
                    'Outstanding Research Award - ACM 2023',
                    'Top 1% Highly Cited Researchers - Clarivate 2022'
                ]
            },
            {
                name: 'TS. Trần Thị B',
                nickname: 'Dr. Thi B Tran',
                role: 'Nghiên cứu viên chính',
                avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b109?w=300&h=300&fit=crop&crop=face',
                googleScholar: 'https://scholar.google.com/citations?user=example2',
                orcid: 'https://orcid.org/0000-0000-0000-0002',
                researchInterests: [
                    'Network Security',
                    '5G/6G Networks',
                    'Machine Learning in Cybersecurity',
                    'Intrusion Detection Systems'
                ],
                bio: 'Tiến sĩ chuyên về bảo mật mạng và AI, với 8 năm kinh nghiệm nghiên cứu. Chuyên gia về các hệ thống phát hiện xâm nhập thông minh.',
                education: [
                    'Tiến sĩ An toàn thông tin - ĐH Quốc gia Singapore (2016)',
                    'Thạc sĩ Mạng máy tính - ĐH Bách khoa HN (2012)',
                    'Cử nhân CNTT - ĐH Công nghệ HN (2010)'
                ],
                achievements: [
                    'Young Researcher Award - IEEE 2023',
                    'Excellence in Research - NUST 2022'
                ]
            },
            {
                name: 'NCS. Lê Minh C',
                nickname: 'Minh C Le',
                role: 'Nghiên cứu sinh tiến sĩ',
                avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&h=300&fit=crop&crop=face',
                googleScholar: 'https://scholar.google.com/citations?user=example3',
                orcid: 'https://orcid.org/0000-0000-0000-0003',
                researchInterests: [
                    'Smart Contracts',
                    'Decentralized Applications',
                    'Supply Chain Management',
                    'Hyperledger Fabric'
                ],
                bio: 'Nghiên cứu sinh năm thứ 3, chuyên về ứng dụng blockchain trong chuỗi cung ứng. Đam mê phát triển các giải pháp thực tế.',
                education: [
                    'Nghiên cứu sinh Khoa học Máy tính - ĐH Bách khoa HN (2022-hiện tại)',
                    'Thạc sĩ Công nghệ phần mềm - ĐH Công nghệ HN (2021)',
                    'Cử nhân CNTT - ĐH FPT (2019)'
                ],
                achievements: [
                    'Best Student Paper - ICBC 2024',
                    'Scholarship Excellence - MOET 2023'
                ]
            },
            {
                name: 'ThS. Phạm Thị D',
                nickname: 'Thi D Pham',
                role: 'Nghiên cứu viên',
                avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&h=300&fit=crop&crop=face',
                googleScholar: 'https://scholar.google.com/citations?user=example4',
                orcid: 'https://orcid.org/0000-0000-0000-0004',
                researchInterests: [
                    'Privacy-Preserving Technologies',
                    'Federated Learning',
                    'IoT Security',
                    'Differential Privacy'
                ],
                bio: 'Thạc sĩ với chuyên môn về bảo vệ quyền riêng tư trong các hệ thống phân tán. Tập trung vào federated learning và IoT.',
                education: [
                    'Thạc sĩ An toàn thông tin - ĐH Bách khoa HN (2022)',
                    'Cử nhân CNTT - ĐH Công nghệ HN (2020)'
                ],
                achievements: [
                    'Outstanding Thesis Award - HUST 2022',
                    'Research Grant Winner - NAFOSTED 2023'
                ]
            }
        ];
        
        // Clear existing members first
        const membersSnapshot = await db.collection('members').get();
        const deletePromises = membersSnapshot.docs.map(doc => doc.ref.delete());
        await Promise.all(deletePromises);
        console.log('🗑️ Đã xóa dữ liệu members cũ');
        
        for (const member of members) {
            await db.collection('members').add(member);
            console.log(`✅ Đã thêm thành viên: ${member.name}`);
        }
        
        // Seed publications với author IDs để liên kết
        const publications = [
            {
                title: 'A Novel Consensus Algorithm for IoT-based Blockchain Networks',
                authors: 'Nguyễn Văn A, Trần Thị B, Lê Minh C',
                authorIds: ['prof-van-a-nguyen', 'dr-thi-b-tran', 'minh-c-le'], // slug-based IDs
                journal: 'Proceedings of the IEEE International Conference on Communications (ICC)',
                year: 2025,
                type: 'Conference Paper',
                abstract: 'This paper introduces a lightweight and energy-efficient consensus algorithm, Proof-of-Activity (PoA), specifically designed for resource-constrained IoT devices. Our proposed algorithm leverages device activity metrics to achieve consensus, significantly reducing computational overhead compared to traditional PoW and PoS systems. Experimental results demonstrate a 40% reduction in energy consumption while maintaining robust security and decentralization.',
                url: 'https://example.com/paper1',
                citations: 15,
                doi: '10.1109/ICC.2025.1234567'
            },
            {
                title: 'Deep Learning-based Intrusion Detection for 5G-enabled Vehicular Networks',
                authors: 'Trần Thị B, Nguyễn Văn A',
                authorIds: ['dr-thi-b-tran', 'prof-van-a-nguyen'],
                journal: 'IEEE Transactions on Vehicular Technology',
                year: 2024,
                type: 'Journal Article',
                abstract: 'As 5G technology enables new V2X (Vehicle-to-Everything) applications, security becomes a paramount concern. We propose a novel intrusion detection system (IDS) using a hybrid Convolutional-Recurrent Neural Network (CRNN) model. The model is trained on a realistic dataset of network traffic and can accurately detect various attacks, including DDoS and man-in-the-middle, with an F1-score of 98.7%.',
                url: 'https://example.com/paper2',
                citations: 23,
                doi: '10.1109/TVT.2024.1234567'
            },
            {
                title: 'Blockchain-based Supply Chain Transparency using Smart Contracts',
                authors: 'Lê Minh C, Phạm Thị D, Nguyễn Văn A',
                authorIds: ['minh-c-le', 'thi-d-pham', 'prof-van-a-nguyen'],
                journal: 'Journal of Network and Computer Applications',
                year: 2024,
                type: 'Journal Article',
                abstract: 'Supply chain transparency has become increasingly important for consumer trust and regulatory compliance. This work presents a comprehensive blockchain-based solution using Hyperledger Fabric and smart contracts to ensure end-to-end traceability of products. Our system provides immutable records of product journey from manufacturer to consumer, reducing counterfeiting by 85% in our pilot study.',
                url: 'https://example.com/paper3',
                citations: 31,
                doi: '10.1016/j.jnca.2024.103456'
            },
            {
                title: 'Privacy-Preserving Federated Learning for IoT Device Classification',
                authors: 'Phạm Thị D, Trần Thị B',
                authorIds: ['thi-d-pham', 'dr-thi-b-tran'],
                journal: 'IEEE Internet of Things Journal',
                year: 2023,
                type: 'Journal Article',
                abstract: 'The proliferation of IoT devices raises significant privacy concerns when implementing centralized machine learning systems. We propose a federated learning framework that enables collaborative model training while preserving individual device privacy. Our approach uses differential privacy and secure aggregation to achieve 94% accuracy in device classification while maintaining strong privacy guarantees.',
                url: 'https://example.com/paper4',
                citations: 18,
                doi: '10.1109/JIOT.2023.1234567'
            },
            {
                title: 'Scalable Blockchain Architecture for Enterprise Applications',
                authors: 'Nguyễn Văn A, Lê Minh C',
                authorIds: ['prof-van-a-nguyen', 'minh-c-le'],
                journal: 'IEEE Computer',
                year: 2023,
                type: 'Magazine Article',
                abstract: 'Enterprise adoption of blockchain technology faces significant scalability challenges. This article presents a novel architecture combining sharding and off-chain computation to achieve enterprise-grade performance while maintaining decentralization.',
                url: 'https://example.com/paper5',
                citations: 42,
                doi: '10.1109/MC.2023.1234567'
            }
        ];
        
        // Clear existing publications
        const publicationsSnapshot = await db.collection('publications').get();
        const deletePubPromises = publicationsSnapshot.docs.map(doc => doc.ref.delete());
        await Promise.all(deletePubPromises);
        console.log('🗑️ Đã xóa dữ liệu publications cũ');
        
        for (const publication of publications) {
            await db.collection('publications').add(publication);
            console.log(`✅ Đã thêm công bố: ${publication.title}`);
        }
        
        // Seed settings
        await db.collection('settings').doc('general').set({
            notificationEmail: 'admin@blockchainist.edu.vn',
            siteName: 'Nhóm Nghiên cứu Blockchain, Mạng & Bảo mật',
            contactEmail: 'contact@blockchainist.edu.vn'
        });
        console.log('✅ Đã thêm cài đặt hệ thống');
        
        console.log('🎉 Hoàn thành seed dữ liệu mẫu!');
        console.log('👉 Bây giờ bạn có thể reload trang để xem dữ liệu mới');
        
    } catch (error) {
        console.error('❌ Lỗi khi seed dữ liệu:', error);
    }
}

// Hướng dẫn sử dụng
console.log(`
🚀 HƯỚNG DẪN SEED DỮ LIỆU MẪU

1. Mở website trong trình duyệt
2. Mở Developer Console (F12)
3. Copy và paste toàn bộ nội dung file này vào console
4. Chạy lệnh: seedSampleData()
5. Đợi cho đến khi thấy thông báo hoàn thành
6. Reload trang để xem dữ liệu mới

⚠️  LưuÝ: Đảm bảo Firebase đã được cấu hình đúng trước khi chạy script
`);

// Export function để có thể gọi từ console
window.seedSampleData = seedSampleData;