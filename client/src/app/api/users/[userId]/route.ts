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
      }),
      {
        status: 200, // Return 200 even on error to provide fallback data
      }
    );
  }
}
