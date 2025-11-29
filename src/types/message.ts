/**
 * Message/Chat Types
 * Simple messaging system between hosts and guests
 */

export interface Message {
	id: string;
	threadId: string; // Links to MessageThread
	senderId: string; // Firebase Auth UID
	senderName: string;
	senderAvatar?: string;
	text: string;
	createdAt: Date;
}

export interface MessageThread {
	id: string;
	reservationId: string; // Links to Reservation
	
	// Participants
	guestId: string;
	guestName: string;
	guestAvatar?: string;
	hostId: string;
	hostName: string;
	hostAvatar?: string;
	
	// Property info
	propertyName: string;
	propertyImage: string;
	
	// Last message info
	lastMessage: string;
	lastMessageAt: Date;
	lastMessageSenderId: string;
	
	// Metadata
	createdAt: Date;
	updatedAt: Date;
}

export interface CreateMessageData {
	threadId: string;
	senderId: string;
	senderName: string;
	senderAvatar?: string;
	text: string;
}

export interface CreateThreadData {
	reservationId: string;
	guestId: string;
	guestName: string;
	guestAvatar?: string;
	hostId: string;
	hostName: string;
	hostAvatar?: string;
	propertyName: string;
	propertyImage: string;
}
