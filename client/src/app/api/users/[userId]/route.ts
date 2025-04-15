import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
): Promise<NextResponse> {
  try {
    const { userId: currentUserId } = await auth();

    if (!currentUserId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { userId } = await params;

    // Get user information from Clerk
    const user = await (await clerkClient()).users.getUser(userId);

    // Return only necessary public information
    return NextResponse.json({
      id: user.id,
      name:
        `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
        "Anonymous User",
      email: user.emailAddresses[0]?.emailAddress || "",
      profileImage: user.imageUrl || "",
      gradeId: user.publicMetadata?.gradeId || null,
    });
  } catch (error) {
    console.error("Error fetching user information:", error);
    return new NextResponse(
      JSON.stringify({
        message: "Failed to fetch user information",
        // Provide fallback information if user not found
        id: (await params).userId,
        name: `Student ${(await params).userId.substring(0, 8)}`,
        email: "",
        profileImage: "",
        gradeId: null,
      }),
      {
        status: 200, // Return 200 even on error to provide fallback data
      }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
): Promise<NextResponse> {
  try {
    const { userId: currentUserId } = await auth();
    const { userId } = await params;

    // Only allow users to update their own data or teachers/admins
    const currentUser = await (
      await clerkClient()
    ).users.getUser(currentUserId || "");
    const isTeacher = currentUser.publicMetadata?.userType === "teacher";

    if (!currentUserId || (currentUserId !== userId && !isTeacher)) {
      return NextResponse.json(
        { message: "Unauthorized to update this user" },
        { status: 401 }
      );
    }

    // Get request body
    const body = await req.json();
    const { gradeId } = body;

    if (gradeId === undefined) {
      return NextResponse.json(
        { message: "Missing required field: gradeId" },
        { status: 400 }
      );
    }

    // Update user metadata
    await (
      await clerkClient()
    ).users.updateUser(userId, {
      publicMetadata: {
        ...currentUser.publicMetadata,
        gradeId: gradeId, // Could be null to remove grade
      },
    });

    // Return success
    return NextResponse.json(
      { message: "User grade updated successfully", gradeId },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating user grade:", error);
    return NextResponse.json(
      { message: "Failed to update user grade" },
      { status: 500 }
    );
  }
}
