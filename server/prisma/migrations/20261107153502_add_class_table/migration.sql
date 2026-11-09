-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "classId" TEXT;

-- CreateTable
CREATE TABLE "Class" (
    "classId" TEXT NOT NULL,
    "className" TEXT NOT NULL,
    "grade" TEXT NOT NULL,
    "maxStudents" INTEGER NOT NULL DEFAULT 40,
    "status" TEXT NOT NULL DEFAULT 'Hoạt động',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "homeroomTeacherId" TEXT,

    CONSTRAINT "Class_pkey" PRIMARY KEY ("classId")
);

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("classId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Class" ADD CONSTRAINT "Class_homeroomTeacherId_fkey" FOREIGN KEY ("homeroomTeacherId") REFERENCES "Teacher"("teacherId") ON DELETE SET NULL ON UPDATE CASCADE;
