const path = 'D:/website/inkai/inkai-backend/node_modules/';
require(path + 'dotenv').config({ path: 'D:/website/inkai/inkai-backend/.env' });
const { PrismaClient } = require(path + '@prisma/client');
const bcrypt = require(path + 'bcryptjs');
const prisma = new PrismaClient();

async function main() {
  console.log('--- SEEDING LIVE SUPABASE DATABASE FOR K-MAJESTIGERS ---');

  // 1. Ensure Roles
  const rolesNeeded = ['ADMINISTRATOR', 'ADMIN_DOJO', 'DOJO_MANAGER', 'MEMBER', 'PARENT'];
  for (const roleName of rolesNeeded) {
    await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: { name: roleName }
    });
  }
  console.log('Roles verified.');

  // 2. Ensure Dojo
  let dojo = await prisma.dojo.findFirst({
    where: { name: { contains: 'Majestigers' } }
  });

  if (!dojo) {
    let branch = await prisma.branch.findFirst();
    if (!branch) {
      let prov = await prisma.province.findFirst();
      if (!prov) {
        prov = await prisma.province.create({ data: { name: 'Jawa Timur' } });
      }
      branch = await prisma.branch.create({
        data: { name: 'Cabang Kota Surabaya', provinceId: prov.id, city: 'Surabaya' }
      });
    }
    dojo = await prisma.dojo.create({
      data: {
        name: 'K-Majestigers Elite Surabaya Dojo',
        branchId: branch.id,
        address: 'GOR Kertajaya / K-Majestigers Training Center, Jl. Kertajaya Indah No. 88, Surabaya',
        contactPerson: 'Sensei Budi Prasetyo, S.Pd.',
        phoneNumber: '0811-9876-5432',
        tempatLatihan: 'Dojo Utama Tatami A & B',
        schedule: 'Senin - Sabtu (16:00 - 20:30 WIB)',
        headName: 'Sensei Budi Prasetyo, S.Pd. (Dan 4 INKAI)',
        bankName: 'Bank BCA',
        bankAccountNumber: '0188-2938-11',
        bankAccountName: 'K-Majestigers Dojo Elite'
      }
    });
  } else {
    dojo = await prisma.dojo.update({
      where: { id: dojo.id },
      data: {
        name: 'K-Majestigers Elite Surabaya Dojo',
        address: 'GOR Kertajaya / K-Majestigers Training Center, Jl. Kertajaya Indah No. 88, Surabaya',
        contactPerson: 'Sensei Budi Prasetyo, S.Pd.',
        phoneNumber: '0811-9876-5432',
        headName: 'Sensei Budi Prasetyo, S.Pd. (Dan 4 INKAI)',
        bankName: 'Bank BCA',
        bankAccountNumber: '0188-2938-11',
        bankAccountName: 'K-Majestigers Dojo Elite'
      }
    });
  }
  console.log('Dojo verified:', dojo.id, dojo.name);

  const defaultPasswordHash = bcrypt.hashSync('majestigers123', 10);

  // 3. Admin User
  let adminRole = await prisma.role.findUnique({ where: { name: 'ADMINISTRATOR' } });
  let adminUser = await prisma.user.upsert({
    where: { email: 'admin@kmajestigers.com' },
    update: {
      passwordHash: defaultPasswordHash,
      fullName: 'Dr. Bambang Suryono',
      phoneNumber: '0813-8899-7700',
      isActive: true,
      roles: { connect: [{ id: adminRole.id }] }
    },
    create: {
      email: 'admin@kmajestigers.com',
      passwordHash: defaultPasswordHash,
      fullName: 'Dr. Bambang Suryono',
      phoneNumber: '0813-8899-7700',
      isActive: true,
      roles: { connect: [{ id: adminRole.id }] }
    }
  });
  console.log('Admin user verified:', adminUser.email);

  // Also update inkaisby@gmail.com with password
  await prisma.user.updateMany({
    where: { email: 'inkaisby@gmail.com' },
    data: { passwordHash: defaultPasswordHash, fullName: 'Super Admin INKAI Surabaya' }
  });

  // 4. Dojo Manager User (Sensei Budi)
  let dojoRole = await prisma.role.findUnique({ where: { name: 'ADMIN_DOJO' } });
  let dojoMgrRole = await prisma.role.findUnique({ where: { name: 'DOJO_MANAGER' } });
  let dojoUser = await prisma.user.upsert({
    where: { email: 'sensei.budi@kmajestigers.com' },
    update: {
      passwordHash: defaultPasswordHash,
      fullName: 'Sensei Budi Prasetyo, S.Pd.',
      phoneNumber: '0811-9876-5432',
      managedDojoId: dojo.id,
      isActive: true,
      roles: {
        connect: [
          { id: dojoRole.id },
          ...(dojoMgrRole ? [{ id: dojoMgrRole.id }] : [])
        ]
      }
    },
    create: {
      email: 'sensei.budi@kmajestigers.com',
      passwordHash: defaultPasswordHash,
      fullName: 'Sensei Budi Prasetyo, S.Pd.',
      phoneNumber: '0811-9876-5432',
      managedDojoId: dojo.id,
      isActive: true,
      roles: {
        connect: [
          { id: dojoRole.id },
          ...(dojoMgrRole ? [{ id: dojoMgrRole.id }] : [])
        ]
      }
    }
  });
  console.log('Dojo Manager verified:', dojoUser.email);

  // 5. Member User (Ahmad Rayhan Putra)
  let memberRole = await prisma.role.findUnique({ where: { name: 'MEMBER' } });
  let athleteUser = await prisma.user.upsert({
    where: { email: 'atlet@kmajestigers.com' },
    update: {
      passwordHash: defaultPasswordHash,
      fullName: 'Ahmad Rayhan Putra',
      phoneNumber: '0812-3456-7890',
      isActive: true,
      roles: { connect: [{ id: memberRole.id }] }
    },
    create: {
      email: 'atlet@kmajestigers.com',
      passwordHash: defaultPasswordHash,
      fullName: 'Ahmad Rayhan Putra',
      phoneNumber: '0812-3456-7890',
      isActive: true,
      roles: { connect: [{ id: memberRole.id }] }
    }
  });

  let athleteMember = await prisma.member.findFirst({
    where: { userId: athleteUser.id }
  });

  if (!athleteMember) {
    athleteMember = await prisma.member.create({
      data: {
        userId: athleteUser.id,
        dojoId: dojo.id,
        nia: 'INA-SBY-8821',
        nik: '3578011405050001',
        fullName: 'Ahmad Rayhan Putra',
        gender: 'Laki-laki',
        birthPlace: 'Surabaya',
        birthDate: new Date('2005-05-14'),
        address: 'Jl. Rungkut Asri Timur No. 12, Surabaya',
        currentRank: 'Sabuk Cokelat (Kyu 2)',
        status: 'AKTIF',
        weight: 66.5,
        height: 175,
        bloodType: 'O+'
      }
    });
  } else {
    athleteMember = await prisma.member.update({
      where: { id: athleteMember.id },
      data: {
        fullName: 'Ahmad Rayhan Putra',
        nia: 'INA-SBY-8821',
        nik: '3578011405050001',
        dojoId: dojo.id,
        currentRank: 'Sabuk Cokelat (Kyu 2)',
        status: 'AKTIF',
        weight: 66.5,
        height: 175,
        bloodType: 'O+'
      }
    });
  }
  console.log('Athlete Member verified:', athleteMember.fullName, athleteMember.nia);

  // 6. Seed Additional Real Athletes for Dojo Roster
  const rosterData = [
    { fullName: 'Dimas Arya Pratama', nia: 'INA-SBY-8822', nik: '3578011002040002', rank: 'Sabuk Hitam (Dan 1)', weight: 59.2, height: 168, gender: 'Laki-laki', blood: 'B+' },
    { fullName: 'Siti Nurhaliza', nia: 'INA-SBY-8823', nik: '3578012508060003', rank: 'Sabuk Cokelat (Kyu 1)', weight: 54.0, height: 162, gender: 'Perempuan', blood: 'A+' },
    { fullName: 'Kevin Sanjaya', nia: 'INA-SBY-8824', nik: '3578011203030004', rank: 'Sabuk Hitam (Dan 1)', weight: 70.0, height: 178, gender: 'Laki-laki', blood: 'AB+' },
    { fullName: 'Bunga Citra Lestari', nia: 'INA-SBY-8825', nik: '3578011809050005', rank: 'Sabuk Cokelat (Kyu 3)', weight: 52.5, height: 160, gender: 'Perempuan', blood: 'O+' },
    { fullName: 'Farhan Maulana', nia: 'INA-SBY-8826', nik: '3578010501060006', rank: 'Sabuk Biru (Kyu 4)', weight: 66.0, height: 173, gender: 'Laki-laki', blood: 'O+' },
    { fullName: 'Rizky Ramadhan', nia: 'INA-SBY-8827', nik: '3578012011050007', rank: 'Sabuk Biru (Kyu 5)', weight: 58.5, height: 167, gender: 'Laki-laki', blood: 'B+' },
    { fullName: 'Nabila Putri', nia: 'INA-SBY-8828', nik: '3578011507060008', rank: 'Sabuk Cokelat (Kyu 2)', weight: 53.8, height: 164, gender: 'Perempuan', blood: 'A+' },
    { fullName: 'Aditya Wardhana', nia: 'INA-SBY-8829', nik: '3578010804020009', rank: 'Sabuk Hitam (Dan 2)', weight: 68.0, height: 176, gender: 'Laki-laki', blood: 'O+' },
    { fullName: 'Hendra Setiawan', nia: 'INA-SBY-8830', nik: '3578012210010010', rank: 'Sabuk Hitam (Dan 1)', weight: 74.5, height: 180, gender: 'Laki-laki', blood: 'B+' },
    { fullName: 'Maya Anggraini', nia: 'INA-SBY-8831', nik: '3578013006050011', rank: 'Sabuk Biru (Kyu 4)', weight: 60.0, height: 165, gender: 'Perempuan', blood: 'AB+' },
    { fullName: 'Zaky Al-Fatih', nia: 'INA-SBY-8832', nik: '3578011408070012', rank: 'Sabuk Hijau (Kyu 6)', weight: 54.5, height: 163, gender: 'Laki-laki', blood: 'O+' },
    { fullName: 'Putri Ayu Wandira', nia: 'INA-SBY-8833', nik: '3578010205060013', rank: 'Sabuk Biru (Kyu 5)', weight: 51.0, height: 159, gender: 'Perempuan', blood: 'A+' },
    { fullName: 'Doni Kusuma', nia: 'INA-SBY-8834', nik: '3578011709040014', rank: 'Sabuk Cokelat (Kyu 3)', weight: 65.5, height: 172, gender: 'Laki-laki', blood: 'B+' },
    { fullName: 'Alif Bahtiar', nia: 'INA-SBY-8835', nik: '3578012812080015', rank: 'Sabuk Kuning (Kyu 7)', weight: 50.0, height: 158, gender: 'Laki-laki', blood: 'O+' }
  ];

  for (const r of rosterData) {
    let existing = await prisma.member.findFirst({ where: { nia: r.nia } });
    if (!existing) {
      await prisma.member.create({
        data: {
          dojoId: dojo.id,
          fullName: r.fullName,
          nia: r.nia,
          nik: r.nik,
          currentRank: r.rank,
          status: 'AKTIF',
          weight: r.weight,
          height: r.height,
          gender: r.gender,
          bloodType: r.blood,
          address: 'Surabaya, Jawa Timur'
        }
      });
    } else {
      await prisma.member.update({
        where: { id: existing.id },
        data: {
          dojoId: dojo.id,
          weight: r.weight,
          height: r.height,
          currentRank: r.rank,
          bloodType: r.blood,
          status: 'AKTIF'
        }
      });
    }
  }
  console.log('Seeded', rosterData.length, 'athletes in dojo roster.');

  // 7. Event & Categories
  let event = await prisma.event.findFirst({
    where: { title: { contains: 'Majestigers' } },
    include: { categories: true }
  });

  if (!event) {
    event = await prisma.event.create({
      data: {
        title: 'K-Majestigers National Open Karate Championship 2026',
        description: 'Kejuaraan Karate Terbuka Tingkat Nasional memperebutkan Piala Bergilir Majestigers dengan sistem digital scoring WKF Standard.',
        startDate: new Date('2026-11-15T08:00:00Z'),
        endDate: new Date('2026-11-17T18:00:00Z'),
        location: 'GOR Pertandingan K-Majestigers Arena, Surabaya'
      },
      include: { categories: true }
    });
  }

  // Ensure standard categories exist
  const catNames = [
    { name: 'Kumite Perorangan Putra -67kg', fee: 150000 },
    { name: 'Kumite Perorangan Putra -60kg', fee: 150000 },
    { name: 'Kumite Perorangan Putri -55kg', fee: 150000 },
    { name: 'Kata Perorangan Senior Putra', fee: 150000 },
    { name: 'Kata Perorangan Senior Putri', fee: 150000 }
  ];

  for (const c of catNames) {
    let exists = event.categories.find(ec => ec.name.toLowerCase() === c.name.toLowerCase());
    if (!exists) {
      await prisma.eventCategory.create({
        data: {
          eventId: event.id,
          name: c.name,
          fee: c.fee
        }
      });
    }
  }
  event = await prisma.event.findUnique({
    where: { id: event.id },
    include: { categories: true }
  });
  console.log('Event verified with', event.categories.length, 'categories.');

  // 8. Matches in Tournament Bracket & Tatami Scoring
  const catKumite67 = event.categories.find(c => c.name.includes('-67kg')) || event.categories[0];
  const catKumite60 = event.categories.find(c => c.name.includes('-60kg')) || event.categories[1];
  const catKumite55 = event.categories.find(c => c.name.includes('-55kg')) || event.categories[2];
  const catKataPutra = event.categories.find(c => c.name.includes('Kata') && c.name.includes('Putra')) || event.categories[3];

  await prisma.match.deleteMany({ where: { eventId: event.id } });

  const matchesData = [
    {
      eventId: event.id,
      categoryId: catKumite67.id,
      round: 'Babak 16 Besar',
      matchNumber: 42,
      tatamiNumber: 2,
      status: 'LIVE',
      akaName: 'Ahmad Rayhan Putra',
      akaDojoName: 'K-Majestigers Elite Surabaya Dojo',
      akaScore: 3,
      akaSenshu: true,
      akaPenalties: 1,
      aoName: 'Satria Wijaya',
      aoDojoName: 'Garuda Karate Club Malang',
      aoScore: 2,
      aoSenshu: false,
      aoPenalties: 2,
      estTime: '14:15 WIB'
    },
    {
      eventId: event.id,
      categoryId: catKumite60.id,
      round: 'Perempat Final',
      matchNumber: 18,
      tatamiNumber: 1,
      status: 'SCHEDULED',
      akaName: 'Dimas Arya Pratama',
      akaDojoName: 'K-Majestigers Elite Surabaya Dojo',
      akaScore: 0,
      akaSenshu: false,
      akaPenalties: 0,
      aoName: 'Rendy Kurniawan',
      aoDojoName: 'Dojo Singo Edan Malang',
      aoScore: 0,
      aoSenshu: false,
      aoPenalties: 0,
      estTime: '14:35 WIB'
    },
    {
      eventId: event.id,
      categoryId: catKumite55.id,
      round: 'Semifinal',
      matchNumber: 29,
      tatamiNumber: 3,
      status: 'SCHEDULED',
      akaName: 'Siti Nurhaliza',
      akaDojoName: 'K-Majestigers Elite Surabaya Dojo',
      akaScore: 0,
      akaSenshu: false,
      akaPenalties: 0,
      aoName: 'Dewi Sartika',
      aoDojoName: 'Dojo Macan Putih Kediri',
      aoScore: 0,
      aoSenshu: false,
      aoPenalties: 0,
      estTime: '15:00 WIB'
    },
    {
      eventId: event.id,
      categoryId: catKataPutra.id,
      round: 'Final',
      matchNumber: 50,
      tatamiNumber: 1,
      status: 'SCHEDULED',
      akaName: 'Kevin Sanjaya',
      akaDojoName: 'K-Majestigers Elite Surabaya Dojo',
      akaScore: 0,
      akaSenshu: false,
      akaPenalties: 0,
      aoName: 'Fajar Alfian',
      aoDojoName: 'Dojo Rajawali Surabaya',
      aoScore: 0,
      aoSenshu: false,
      aoPenalties: 0,
      estTime: '16:15 WIB'
    },
    {
      eventId: event.id,
      categoryId: catKumite67.id,
      round: 'Babak 32 Besar',
      matchNumber: 12,
      tatamiNumber: 2,
      status: 'COMPLETED',
      akaName: 'Ahmad Rayhan Putra',
      akaDojoName: 'K-Majestigers Elite Surabaya Dojo',
      akaScore: 6,
      akaSenshu: true,
      akaPenalties: 0,
      aoName: 'Bagas Ramadhan',
      aoDojoName: 'Dojo Ksatria Sidoarjo',
      aoScore: 1,
      aoSenshu: false,
      aoPenalties: 3,
      winnerName: 'Ahmad Rayhan Putra',
      estTime: '11:20 WIB'
    }
  ];

  for (const m of matchesData) {
    await prisma.match.create({ data: m });
  }
  console.log('Seeded', matchesData.length, 'live tournament matches.');

  // 9. Event Registrations
  for (const r of [athleteMember, ...await prisma.member.findMany({ where: { dojoId: dojo.id }, take: 8 })]) {
    let reg = await prisma.eventRegistration.findFirst({
      where: { eventId: event.id, memberId: r.id }
    });
    if (!reg) {
      await prisma.eventRegistration.create({
        data: {
          eventId: event.id,
          memberId: r.id,
          categoryId: catKumite67.id,
          status: 'APPROVED',
          registeredRank: r.currentRank
        }
      });
    }
  }
  console.log('Event registrations verified.');

  // 10. Billing & Payments for Dojo Contingent
  const billingDesc = 'Invoice Biaya Kontingen Kejuaraan Nasional K-Majestigers 2026 (#INV-KM-2026-088)';
  let billing = await prisma.billing.findFirst({
    where: { memberId: athleteMember.id, description: { contains: 'INV-KM-2026-088' } }
  });

  if (!billing) {
    billing = await prisma.billing.create({
      data: {
        memberId: athleteMember.id,
        type: 'EVENT_REGISTRATION',
        amount: 8750000,
        description: billingDesc,
        dueDate: new Date('2026-11-01'),
        status: 'PAID'
      }
    });

    await prisma.payment.create({
      data: {
        billingId: billing.id,
        paymentMethod: 'QRIS_STATIC',
        externalId: 'QRIS-TRX-88219-LUNAS',
        paidAt: new Date('2026-10-15T09:30:00Z'),
        proofUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=500'
      }
    });
  }
  console.log('Billing & Payment verified:', billing.id);

  // 11. Verifications
  await prisma.verification.deleteMany({ where: { memberId: athleteMember.id } });
  await prisma.verification.createMany({
    data: [
      {
        memberId: athleteMember.id,
        eventId: event.id,
        type: 'SURAT_KESEHATAN',
        data: 'Surat Keterangan Bebas Cedera & EKG dari RS Premier Surabaya',
        proofUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=500',
        status: 'APPROVED',
        adminNotes: 'Terverifikasi medis resmi oleh dr. Spesialis Olahraga.'
      },
      {
        memberId: athleteMember.id,
        eventId: event.id,
        type: 'IJAZAH_SABUK',
        data: 'Ijazah Kyu 2 Sabuk Cokelat PB INKAI No: INKAI-2024-C9921',
        proofUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=500',
        status: 'APPROVED',
        adminNotes: 'Absah sesuai pangkalan data INKAI Jawa Timur.'
      },
      {
        memberId: athleteMember.id,
        eventId: event.id,
        type: 'BUKTI_PEMBAYARAN_KONTINGEN',
        data: 'Pembayaran Kontingen #INV-KM-2026-088 Rp 8.750.000',
        proofUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=500',
        status: 'APPROVED',
        adminNotes: 'Dana telah kliring di rekening BCA Dojo.'
      }
    ]
  });
  console.log('Verifications seeded.');

  // 12. Products / Merchandise
  const storeProducts = [
    {
      name: 'Dogi Kumite WKF Approved Arawaza Onyx Zero Gravity',
      description: 'Seragam tanding kumite resmi berstandar WKF dengan sirkulasi udara ultra-cepat dan kain microfiber super ringan.',
      price: 1450000,
      stock: 24,
      imageUrl: 'https://images.unsplash.com/photo-1555597673-b21d5c935865?w=500'
    },
    {
      name: 'Sarung Tangan Kumite AKA & AO WKF Approved',
      description: 'Hand protector pelindung buku jari resmi WKF busa injeksi padat dengan perlindungan ergonomis benturan.',
      price: 425000,
      stock: 48,
      imageUrl: 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=500'
    },
    {
      name: 'Pelindung Kaki / Shin Guard Removable Foot WKF',
      description: 'Pelindung tulang kering dan tempurung kaki kombinasi red & blue dengan strap velcro kuat non-slip.',
      price: 580000,
      stock: 32,
      imageUrl: 'https://images.unsplash.com/photo-1517438322307-e67111335449?w=500'
    },
    {
      name: 'Sabuk Hitam Bordir Kanji Sutra Jepang Premium',
      description: 'Sabuk Dan Master INKAI kualitas katun tebal dengan benang bordir emas tahan luntur buatan perajin Kyoto.',
      price: 320000,
      stock: 60,
      imageUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=500'
    }
  ];

  for (const prod of storeProducts) {
    let p = await prisma.product.findFirst({ where: { name: prod.name } });
    if (!p) {
      await prisma.product.create({ data: prod });
    } else {
      await prisma.product.update({
        where: { id: p.id },
        data: { price: prod.price, stock: prod.stock, imageUrl: prod.imageUrl }
      });
    }
  }
  console.log('Store products verified.');

  console.log('--- ALL LIVE SUPABASE DATABASE SEEDING COMPLETED SUCCESSFULLY ---');
}

main().catch(err => {
  console.error('SEEDING ERROR:', err);
  process.exit(1);
}).finally(() => prisma.$disconnect());
