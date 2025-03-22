import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

// Demo physics course data with sections and chapters
const physicsCoursesData = {
  phys1: {
    id: "phys1",
    title: "Fundamental Forces and Motion",
    description: "Learn about Newton's laws, gravity, and basic kinematics",
    sections: [
      {
        id: "s1",
        title: "Kinematics",
        chapters: [
          {
            id: "c1",
            title: "Distance, Displacement, and Speed",
            hasPresentation: true,
            hasVideo: true,
          },
          {
            id: "c2",
            title: "Velocity and Acceleration",
            hasPresentation: true,
            hasVideo: true,
          },
          {
            id: "c3",
            title: "Graphing Motion",
            hasPresentation: true,
            hasVideo: false,
          },
        ],
      },
      {
        id: "s2",
        title: "Newton's Laws of Motion",
        chapters: [
          {
            id: "c4",
            title: "First Law: Inertia",
            hasPresentation: true,
            hasVideo: true,
          },
          {
            id: "c5",
            title: "Second Law: Force and Acceleration",
            hasPresentation: true,
            hasVideo: true,
          },
          {
            id: "c6",
            title: "Third Law: Action and Reaction",
            hasPresentation: true,
            hasVideo: true,
          },
        ],
      },
      {
        id: "s3",
        title: "Gravity and Projectile Motion",
        chapters: [
          {
            id: "c7",
            title: "Gravity and Free Fall",
            hasPresentation: true,
            hasVideo: true,
          },
          {
            id: "c8",
            title: "Projectile Motion",
            hasPresentation: true,
            hasVideo: true,
          },
          {
            id: "c9",
            title: "Circular Motion",
            hasPresentation: true,
            hasVideo: false,
          },
        ],
      },
    ],
  },
  phys2: {
    id: "phys2",
    title: "Energy and Simple Machines",
    description:
      "Explore potential and kinetic energy, work, and simple machines",
    sections: [
      {
        id: "s4",
        title: "Work and Energy",
        chapters: [
          {
            id: "c10",
            title: "Work and Power",
            hasPresentation: true,
            hasVideo: true,
          },
          {
            id: "c11",
            title: "Kinetic Energy",
            hasPresentation: true,
            hasVideo: true,
          },
          {
            id: "c12",
            title: "Potential Energy",
            hasPresentation: true,
            hasVideo: true,
          },
        ],
      },
      {
        id: "s5",
        title: "Conservation of Energy",
        chapters: [
          {
            id: "c13",
            title: "Energy Transformations",
            hasPresentation: true,
            hasVideo: true,
          },
          {
            id: "c14",
            title: "Conservation of Energy",
            hasPresentation: true,
            hasVideo: false,
          },
          {
            id: "c15",
            title: "Energy in Systems",
            hasPresentation: false,
            hasVideo: true,
          },
        ],
      },
      {
        id: "s6",
        title: "Simple Machines",
        chapters: [
          {
            id: "c16",
            title: "Levers and Pulleys",
            hasPresentation: true,
            hasVideo: true,
          },
          {
            id: "c17",
            title: "Inclined Planes and Wedges",
            hasPresentation: true,
            hasVideo: true,
          },
          {
            id: "c18",
            title: "Screws and Wheel and Axle",
            hasPresentation: false,
            hasVideo: true,
          },
        ],
      },
    ],
  },
  phys3: {
    id: "phys3",
    title: "Waves, Sound and Light",
    description: "Study wave properties, sound phenomena, and basics of light",
    sections: [
      {
        id: "s7",
        title: "Wave Properties",
        chapters: [
          {
            id: "c19",
            title: "Types of Waves",
            hasPresentation: true,
            hasVideo: true,
          },
          {
            id: "c20",
            title: "Wave Characteristics",
            hasPresentation: true,
            hasVideo: true,
          },
          {
            id: "c21",
            title: "Wave Interactions",
            hasPresentation: true,
            hasVideo: true,
          },
        ],
      },
      {
        id: "s8",
        title: "Sound Phenomena",
        chapters: [
          {
            id: "c22",
            title: "Sound Waves and Properties",
            hasPresentation: true,
            hasVideo: true,
          },
          {
            id: "c23",
            title: "Resonance and Harmonics",
            hasPresentation: true,
            hasVideo: true,
          },
          {
            id: "c24",
            title: "The Doppler Effect",
            hasPresentation: true,
            hasVideo: false,
          },
        ],
      },
      {
        id: "s9",
        title: "Light and Optics",
        chapters: [
          {
            id: "c25",
            title: "Light as a Wave",
            hasPresentation: true,
            hasVideo: true,
          },
          {
            id: "c26",
            title: "Reflection and Mirrors",
            hasPresentation: true,
            hasVideo: true,
          },
          {
            id: "c27",
            title: "Refraction and Lenses",
            hasPresentation: true,
            hasVideo: true,
          },
        ],
      },
    ],
  },
  phys4: {
    id: "phys4",
    title: "Electricity and Magnetism",
    description:
      "Discover static electricity, circuits, and electromagnetic principles",
    sections: [
      {
        id: "s10",
        title: "Static Electricity",
        chapters: [
          {
            id: "c28",
            title: "Electric Charge",
            hasPresentation: true,
            hasVideo: true,
          },
          {
            id: "c29",
            title: "Coulomb's Law",
            hasPresentation: true,
            hasVideo: false,
          },
          {
            id: "c30",
            title: "Electric Fields",
            hasPresentation: true,
            hasVideo: false,
          },
        ],
      },
      {
        id: "s11",
        title: "Electric Circuits",
        chapters: [
          {
            id: "c31",
            title: "Current and Voltage",
            hasPresentation: true,
            hasVideo: true,
          },
          {
            id: "c32",
            title: "Resistance and Ohm's Law",
            hasPresentation: true,
            hasVideo: true,
          },
          {
            id: "c33",
            title: "Series and Parallel Circuits",
            hasPresentation: true,
            hasVideo: true,
          },
        ],
      },
      {
        id: "s12",
        title: "Magnetism and Electromagnetism",
        chapters: [
          {
            id: "c34",
            title: "Magnets and Magnetic Fields",
            hasPresentation: true,
            hasVideo: true,
          },
          {
            id: "c35",
            title: "Electromagnets",
            hasPresentation: true,
            hasVideo: true,
          },
          {
            id: "c36",
            title: "Electromagnetic Induction",
            hasPresentation: false,
            hasVideo: true,
          },
        ],
      },
    ],
  },
};

export async function GET(
  request: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    // Verify user authentication
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { courseId } = params;
    console.log(`Fetching course details for course ${courseId}`);

    // Check if this is a demo physics course
    if (
      courseId.startsWith("phys") &&
      physicsCoursesData[courseId as keyof typeof physicsCoursesData]
    ) {
      console.log(`Returning demo data for physics course ${courseId}`);
      return NextResponse.json(
        physicsCoursesData[courseId as keyof typeof physicsCoursesData]
      );
    }

    // Forward the request to the backend API
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/courses/${courseId}`,
        {
          headers: {
            "Content-Type": "application/json",
          },
          cache: "no-store",
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Backend API error:", errorText);

        // Return demo data for physics courses if available
        if (
          courseId.startsWith("phys") &&
          physicsCoursesData[courseId as keyof typeof physicsCoursesData]
        ) {
          console.log(
            `Backend error, returning demo data for physics course ${courseId}`
          );
          return NextResponse.json(
            physicsCoursesData[courseId as keyof typeof physicsCoursesData]
          );
        }

        if (response.status === 404) {
          return NextResponse.json(
            { error: "Course not found" },
            { status: 404 }
          );
        }
        return NextResponse.json(
          { error: "Failed to fetch course details" },
          { status: response.status }
        );
      }

      const data = await response.json();
      return NextResponse.json(data);
    } catch (error) {
      console.error("Error fetching course details:", error);

      // Return demo data for physics courses if available
      if (
        courseId.startsWith("phys") &&
        physicsCoursesData[courseId as keyof typeof physicsCoursesData]
      ) {
        console.log(
          `Error fetching from backend, returning demo data for physics course ${courseId}`
        );
        return NextResponse.json(
          physicsCoursesData[courseId as keyof typeof physicsCoursesData]
        );
      }

      return NextResponse.json(
        { error: "Failed to fetch course details" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in course details API route:", error);

    // Return demo data for physics courses if available
    if (
      params.courseId.startsWith("phys") &&
      physicsCoursesData[params.courseId as keyof typeof physicsCoursesData]
    ) {
      console.log(
        `API route error, returning demo data for physics course ${params.courseId}`
      );
      return NextResponse.json(
        physicsCoursesData[params.courseId as keyof typeof physicsCoursesData]
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
