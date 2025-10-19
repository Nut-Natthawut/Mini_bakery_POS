# MiniBakery_POS

| สมาชิก | ตำแหน่ง |
| :-------------------------- | :---------------- |
| นายศิวกร สว่างอุระ | PO / BA |
| นายณัฐวุฒิ แก่นเสา | SCRUM MASTER / DEV |
| นางสาววัญชานิกา สว่างเนตร | UXUI / BA |
| นายชลกร นวลบุญ | DEV |
| นายพาคร อินเพ็ชร | DEV |

---

##  รายละเอียดโปรเจกต์

**MiniBakery_POS** เป็นระบบ **Point of Sale (POS)** สำหรับร้านเบเกอรี่ขนาดเล็ก  
ออกแบบมาเพื่อช่วยเจ้าของร้านและพนักงานจัดการข้อมูลสินค้า เมนู ใบเสร็จ และคำสั่งซื้อได้สะดวกขึ้น  
โครงการนี้พัฒนาโดยใช้ **Next.js + Prisma + PostgreSQL + Supabase**  
พร้อมระบบ **สิทธิ์ผู้ใช้งาน (Owner / Staff)** และการออกใบเสร็จอัตโนมัติ

---

##  เป้าหมายของระบบ

- จัดการเมนูสินค้า (เพิ่ม / แก้ไข / ลบ / อัปโหลดรูปภาพ)
- จัดการคำสั่งซื้อ (สร้างบิล, ตรวจสอบยอด, ป้องกันการซ้ำ)
- จัดการผู้ใช้งาน (Owner / Staff) และสิทธิ์การเข้าถึง
- สร้างใบเสร็จอัตโนมัติผ่าน Stored Procedure ใน PostgreSQL
- เชื่อมต่อ Supabase สำหรับจัดเก็บรูปภาพสินค้า

---

##  เทคโนโลยีที่ใช้

| ประเภท | เทคโนโลยี |
| :-- | :-- |
| **Frontend** | Next.js 14 (App Router), React, TailwindCSS |
| **Backend** | Next.js Server Actions, Prisma ORM |
| **Database** | PostgreSQL (ผ่าน Supabase) |
| **UI Framework** | ShadCN / Radix UI / Chakra UI (บางส่วน) |
| **Auth** | JWT + Middleware ตรวจสอบสิทธิ์ |
| **Tools** | Git / GitHub / VSCode / Supabase Console |

---

##  โครงสร้างโปรเจกต์

```bash
MiniBakery_POS/
├── app-pos/                     # Source code หลัก
│   ├── prisma/                  # Schema และ migration ของฐานข้อมูล
│   ├── src/app/Owner/           # ส่วน Owner UI (จัดการเมนู, ผู้ใช้)
│   ├── lib/                     # Helper เช่น supabaseClient, auth
│   ├── types/                   # TypeScript types และ schema validation
│   └── components/              # UI components และฟอร์ม
│
├── README.md                    # คำอธิบายโปรเจกต์ (ไฟล์นี้)
├── package.json                 # รายชื่อ dependencies
├── tailwind.config.js           # ตั้งค่า TailwindCSS
├── postcss.config.js            # ตั้งค่า PostCSS
└── prisma/schema.prisma         # โครงสร้างฐานข้อมูล

วิธีติดตั้งและใช้งาน

1. Clone โปรเจกต์

git clone https://github.com/Nut-Natthawut/Mini_bakery_POS.git
cd Mini_bakery_POS/app-pos

2. ติดตั้ง dependencies

npm install

3. ตั้งค่า Environment Variables

สร้างไฟล์ .env แล้วใส่ข้อมูลดังนี้
(ใช้ค่า PostgreSQL ของคุณเอง)

DATABASE_URL="postgresql://user:password@host:port/dbname"
DIRECT_URL="postgresql://user:password@host:port/dbname"
NEXT_PUBLIC_SUPABASE_URL="https://xxxxxxxx.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="your_service_role_key"
JWT_SECRET="changeme-secret"

4. รัน Prisma และ Generate Client
npx prisma migrate dev
npx prisma generate

5. รันโปรเจกต์
npm run dev

ฟีเจอร์หลัก

ระบบล็อกอินด้วย JWT Cookies
จัดการเมนูสินค้า (CRUD + อัปโหลดรูปภาพ)
ระบบใบเสร็จอัตโนมัติ (Stored Procedure)
Event & Trigger ตรวจสอบคำสั่งซื้อซ้ำ
ระบบสิทธิ์ผู้ใช้ (Owner / Staff)
UI ตอบสนองเร็ว พร้อม Toast แจ้งเตือน