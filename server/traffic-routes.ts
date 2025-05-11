/**
 * Traffic Management Routes
 * 
 * This file contains all the routes for the traffic management system:
 * - Commercial clients management
 * - Advertising campaigns
 * - Commercial spots
 * - Reporting and invoicing
 */

import express, { Request, Response } from 'express';
import { isAuthenticated, hasRole } from './auth';
import { WebSocketServer } from 'ws';
import { RadioAutomationStorage } from './radio-automation-storage';
import { 
  insertCommercialClientSchema, 
  insertCommercialCampaignSchema, 
  insertCommercialSpotSchema 
} from '@shared/schema';
import { db } from './db';

// Create instance of RadioAutomationStorage
const radioAutomationStorage = new RadioAutomationStorage();

export function setupTrafficRoutes(app: express.Express, wss: WebSocketServer) {
  // Re-export the existing endpoints from radio-automation-routes
  // This is done to maintain structure while moving traffic endpoints to their own file
  
  // Client management
  app.get('/api/radio/commercial/clients', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const clients = await radioAutomationStorage.getCommercialClients();
      res.json(clients);
    } catch (error) {
      console.error('Error fetching commercial clients:', error);
      res.status(500).json({ error: 'Failed to fetch commercial clients' });
    }
  });

  app.get('/api/radio/commercial/clients/:id', isAuthenticated, async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid client ID' });
    }

    try {
      const client = await radioAutomationStorage.getCommercialClientById(id);
      if (!client) {
        return res.status(404).json({ error: 'Client not found' });
      }
      res.json(client);
    } catch (error) {
      console.error('Error fetching commercial client:', error);
      res.status(500).json({ error: 'Failed to fetch commercial client' });
    }
  });

  app.post('/api/radio/commercial/clients', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const parseResult = insertCommercialClientSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ error: 'Invalid client data', details: parseResult.error });
      }

      const newClient = await radioAutomationStorage.createCommercialClient(parseResult.data);
      res.status(201).json(newClient);
    } catch (error) {
      console.error('Error creating commercial client:', error);
      res.status(500).json({ error: 'Failed to create commercial client' });
    }
  });

  app.patch('/api/radio/commercial/clients/:id', isAuthenticated, async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid client ID' });
    }

    try {
      const existingClient = await radioAutomationStorage.getCommercialClientById(id);
      if (!existingClient) {
        return res.status(404).json({ error: 'Client not found' });
      }

      const updatedClient = await radioAutomationStorage.updateCommercialClient(id, req.body);
      res.json(updatedClient);
    } catch (error) {
      console.error('Error updating commercial client:', error);
      res.status(500).json({ error: 'Failed to update commercial client' });
    }
  });

  app.delete('/api/radio/commercial/clients/:id', isAuthenticated, async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid client ID' });
    }

    try {
      const existingClient = await radioAutomationStorage.getCommercialClientById(id);
      if (!existingClient) {
        return res.status(404).json({ error: 'Client not found' });
      }

      await radioAutomationStorage.deleteCommercialClient(id);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting commercial client:', error);
      res.status(500).json({ error: 'Failed to delete commercial client' });
    }
  });

  // Campaign management
  app.get('/api/radio/commercial/campaigns', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const clientId = req.query.clientId ? parseInt(req.query.clientId as string) : undefined;
      const campaigns = await radioAutomationStorage.getCommercialCampaigns({ clientId });
      res.json(campaigns);
    } catch (error) {
      console.error('Error fetching commercial campaigns:', error);
      res.status(500).json({ error: 'Failed to fetch commercial campaigns' });
    }
  });

  app.get('/api/radio/commercial/campaigns/:id', isAuthenticated, async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid campaign ID' });
    }

    try {
      const campaign = await radioAutomationStorage.getCommercialCampaignById(id);
      if (!campaign) {
        return res.status(404).json({ error: 'Campaign not found' });
      }
      res.json(campaign);
    } catch (error) {
      console.error('Error fetching commercial campaign:', error);
      res.status(500).json({ error: 'Failed to fetch commercial campaign' });
    }
  });

  app.post('/api/radio/commercial/campaigns', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const parseResult = insertCommercialCampaignSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ error: 'Invalid campaign data', details: parseResult.error });
      }

      const newCampaign = await radioAutomationStorage.createCommercialCampaign(parseResult.data);
      res.status(201).json(newCampaign);
    } catch (error) {
      console.error('Error creating commercial campaign:', error);
      res.status(500).json({ error: 'Failed to create commercial campaign' });
    }
  });

  app.patch('/api/radio/commercial/campaigns/:id', isAuthenticated, async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid campaign ID' });
    }

    try {
      const existingCampaign = await radioAutomationStorage.getCommercialCampaignById(id);
      if (!existingCampaign) {
        return res.status(404).json({ error: 'Campaign not found' });
      }

      const updatedCampaign = await radioAutomationStorage.updateCommercialCampaign(id, req.body);
      res.json(updatedCampaign);
    } catch (error) {
      console.error('Error updating commercial campaign:', error);
      res.status(500).json({ error: 'Failed to update commercial campaign' });
    }
  });

  app.delete('/api/radio/commercial/campaigns/:id', isAuthenticated, async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid campaign ID' });
    }

    try {
      const existingCampaign = await radioAutomationStorage.getCommercialCampaignById(id);
      if (!existingCampaign) {
        return res.status(404).json({ error: 'Campaign not found' });
      }

      await radioAutomationStorage.deleteCommercialCampaign(id);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting commercial campaign:', error);
      res.status(500).json({ error: 'Failed to delete commercial campaign' });
    }
  });

  // Spot management
  app.get('/api/radio/commercial/campaigns/:id/spots', isAuthenticated, async (req: Request, res: Response) => {
    const campaignId = parseInt(req.params.id);
    if (isNaN(campaignId)) {
      return res.status(400).json({ error: 'Invalid campaign ID' });
    }

    try {
      const spots = await radioAutomationStorage.getCommercialSpots(campaignId);
      res.json(spots);
    } catch (error) {
      console.error('Error fetching commercial spots:', error);
      res.status(500).json({ error: 'Failed to fetch commercial spots' });
    }
  });

  app.post('/api/radio/commercial/campaigns/:id/spots', isAuthenticated, async (req: Request, res: Response) => {
    const campaignId = parseInt(req.params.id);
    if (isNaN(campaignId)) {
      return res.status(400).json({ error: 'Invalid campaign ID' });
    }

    try {
      const parseResult = insertCommercialSpotSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ error: 'Invalid spot data', details: parseResult.error });
      }

      const newSpot = await radioAutomationStorage.createCommercialSpot(campaignId, parseResult.data);
      res.status(201).json(newSpot);
    } catch (error) {
      console.error('Error creating commercial spot:', error);
      res.status(500).json({ error: 'Failed to create commercial spot' });
    }
  });

  app.delete('/api/radio/commercial/campaigns/:id/spots/:spotId', isAuthenticated, async (req: Request, res: Response) => {
    const campaignId = parseInt(req.params.id);
    const spotId = parseInt(req.params.spotId);
    if (isNaN(campaignId) || isNaN(spotId)) {
      return res.status(400).json({ error: 'Invalid campaign or spot ID' });
    }

    try {
      await radioAutomationStorage.deleteCommercialSpot(campaignId, spotId);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting commercial spot:', error);
      res.status(500).json({ error: 'Failed to delete commercial spot' });
    }
  });

  // Reporting and Invoicing
  app.get('/api/radio/commercial/campaigns/:id/logs', isAuthenticated, async (req: Request, res: Response) => {
    const campaignId = parseInt(req.params.id);
    if (isNaN(campaignId)) {
      return res.status(400).json({ error: 'Invalid campaign ID' });
    }

    try {
      const logs = await radioAutomationStorage.getCampaignPlayLogs(campaignId);
      res.json(logs);
    } catch (error) {
      console.error('Error fetching campaign play logs:', error);
      res.status(500).json({ error: 'Failed to fetch campaign play logs' });
    }
  });

  app.get('/api/radio/commercial/campaigns/:id/report', isAuthenticated, async (req: Request, res: Response) => {
    const campaignId = parseInt(req.params.id);
    if (isNaN(campaignId)) {
      return res.status(400).json({ error: 'Invalid campaign ID' });
    }

    try {
      const campaign = await radioAutomationStorage.getCommercialCampaignById(campaignId);
      if (!campaign) {
        return res.status(404).json({ error: 'Campaign not found' });
      }
      
      const spots = await radioAutomationStorage.getCommercialSpots(campaignId);
      const logs = await radioAutomationStorage.getCampaignPlayLogs(campaignId);
      const client = await radioAutomationStorage.getCommercialClientById(campaign.clientId);
      
      const report = {
        campaign,
        client,
        spots,
        logs,
        generatedAt: new Date(),
        totalPlays: logs.length,
        spotCount: spots.length,
        completionPercentage: spots.length > 0 ? (logs.length / (campaign.totalSpots || 1) * 100).toFixed(2) + '%' : '0%'
      };
      
      res.json(report);
    } catch (error) {
      console.error('Error generating campaign report:', error);
      res.status(500).json({ error: 'Failed to generate campaign report' });
    }
  });

  app.get('/api/radio/commercial/campaigns/:id/invoice', isAuthenticated, hasRole('admin'), async (req: Request, res: Response) => {
    const campaignId = parseInt(req.params.id);
    if (isNaN(campaignId)) {
      return res.status(400).json({ error: 'Invalid campaign ID' });
    }

    try {
      const campaign = await radioAutomationStorage.getCommercialCampaignById(campaignId);
      if (!campaign) {
        return res.status(404).json({ error: 'Campaign not found' });
      }
      
      const client = await radioAutomationStorage.getCommercialClientById(campaign.clientId);
      const spots = await radioAutomationStorage.getCommercialSpots(campaignId);
      const logs = await radioAutomationStorage.getCampaignPlayLogs(campaignId);
      
      // Generate a simple invoice
      const invoice = {
        invoiceNumber: `INV-${campaign.id}-${Date.now().toString().substring(9)}`,
        campaign,
        client,
        spots,
        playCount: logs.length,
        date: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        total: campaign.totalSpots * 50, // Example price calculation
        status: campaign.invoiceStatus || 'pending'
      };
      
      // In a real app, this would generate a PDF or formal invoice
      res.json(invoice);
    } catch (error) {
      console.error('Error generating campaign invoice:', error);
      res.status(500).json({ error: 'Failed to generate campaign invoice' });
    }
  });
}