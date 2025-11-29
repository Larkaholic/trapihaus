import {
	doc,
	getDoc,
	setDoc,
	collection,
	query,
	where,
	getDocs,
	serverTimestamp,
	Timestamp,
	orderBy,
	updateDoc,
} from "firebase/firestore";
import { getFirestoreClient } from "@/lib/firebase/firestore";
import type { Message, MessageThread, CreateMessageData, CreateThreadData } from "@/types/message";

const THREADS_COLLECTION = "messageThreads";
const MESSAGES_COLLECTION = "messages";

/**
 * Create or get existing message thread for a reservation
 * @param data - Thread data
 * @returns The thread ID
 */
export async function createOrGetThread(data: CreateThreadData): Promise<string> {
	const db = getFirestoreClient();
	const threadsRef = collection(db, THREADS_COLLECTION);
	
	// Check if thread already exists for this reservation
	const existingThreadQuery = query(
		threadsRef,
		where("reservationId", "==", data.reservationId)
	);
	
	const existingThreads = await getDocs(existingThreadQuery);
	
	if (!existingThreads.empty) {
		return existingThreads.docs[0].id;
	}
	
	// Create new thread
	const newThreadRef = doc(threadsRef);
	await setDoc(newThreadRef, {
		...data,
		lastMessage: "",
		lastMessageAt: serverTimestamp(),
		lastMessageSenderId: "",
		createdAt: serverTimestamp(),
		updatedAt: serverTimestamp(),
	});
	
	return newThreadRef.id;
}

/**
 * Send a message in a thread
 * @param data - Message data
 * @returns The created message ID
 */
export async function sendMessage(data: CreateMessageData): Promise<string> {
	const db = getFirestoreClient();
	const messagesRef = collection(db, MESSAGES_COLLECTION);
	const newMessageRef = doc(messagesRef);
	
	// Create the message
	await setDoc(newMessageRef, {
		...data,
		createdAt: serverTimestamp(),
	});
	
	// Update thread's last message info
	const threadRef = doc(db, THREADS_COLLECTION, data.threadId);
	await updateDoc(threadRef, {
		lastMessage: data.text,
		lastMessageAt: serverTimestamp(),
		lastMessageSenderId: data.senderId,
		updatedAt: serverTimestamp(),
	});
	
	return newMessageRef.id;
}

/**
 * Get all threads for a user (as host or guest)
 * @param userId - User's Firebase Auth UID
 * @returns Array of MessageThread
 */
export async function getUserThreads(userId: string): Promise<MessageThread[]> {
	const db = getFirestoreClient();
	const threadsRef = collection(db, THREADS_COLLECTION);
	
	// Get threads where user is either host or guest
	const asHostQuery = query(
		threadsRef,
		where("hostId", "==", userId),
		orderBy("lastMessageAt", "desc")
	);
	
	const asGuestQuery = query(
		threadsRef,
		where("guestId", "==", userId),
		orderBy("lastMessageAt", "desc")
	);
	
	const [hostThreads, guestThreads] = await Promise.all([
		getDocs(asHostQuery),
		getDocs(asGuestQuery)
	]);
	
	const threads: MessageThread[] = [];
	
	// Process host threads
	hostThreads.forEach((doc) => {
		const data = doc.data();
		threads.push({
			id: doc.id,
			...data,
			lastMessageAt: data.lastMessageAt instanceof Timestamp ? data.lastMessageAt.toDate() : new Date(),
			createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
			updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(),
		} as MessageThread);
	});
	
	// Process guest threads
	guestThreads.forEach((doc) => {
		const data = doc.data();
		threads.push({
			id: doc.id,
			...data,
			lastMessageAt: data.lastMessageAt instanceof Timestamp ? data.lastMessageAt.toDate() : new Date(),
			createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
			updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(),
		} as MessageThread);
	});
	
	// Sort by last message time
	return threads.sort((a, b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime());
}

/**
 * Get all messages in a thread
 * @param threadId - Thread ID
 * @returns Array of Message
 */
export async function getThreadMessages(threadId: string): Promise<Message[]> {
	const db = getFirestoreClient();
	const messagesRef = collection(db, MESSAGES_COLLECTION);
	
	const q = query(
		messagesRef,
		where("threadId", "==", threadId),
		orderBy("createdAt", "asc")
	);
	
	const querySnapshot = await getDocs(q);
	const messages: Message[] = [];
	
	querySnapshot.forEach((doc) => {
		const data = doc.data();
		messages.push({
			id: doc.id,
			...data,
			createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
		} as Message);
	});
	
	return messages;
}

/**
 * Get a specific thread
 * @param threadId - Thread ID
 * @returns MessageThread or null
 */
export async function getThread(threadId: string): Promise<MessageThread | null> {
	const db = getFirestoreClient();
	const threadRef = doc(db, THREADS_COLLECTION, threadId);
	const threadSnap = await getDoc(threadRef);
	
	if (!threadSnap.exists()) {
		return null;
	}
	
	const data = threadSnap.data();
	return {
		id: threadSnap.id,
		...data,
		lastMessageAt: data.lastMessageAt instanceof Timestamp ? data.lastMessageAt.toDate() : new Date(),
		createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
		updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(),
	} as MessageThread;
}
