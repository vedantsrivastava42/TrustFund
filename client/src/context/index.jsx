import React, { useContext, createContext } from 'react';

import { useAddress, useContract, useConnect, metamaskWallet , useContractWrite, useDisconnect, useWallet  } from '@thirdweb-dev/react';
import { ethers } from 'ethers';

const StateContext = createContext();

const metamaskConfig = metamaskWallet();

export const StateContextProvider = ({ children }) => {
    const { contract } = useContract('0x345bF5A847F7A0B5A9C9334613239EA70774e2a1');
    const { mutateAsync: createCampaign } = useContractWrite(contract, 'createCampaign');

    const address = useAddress();
    const connect = useConnect();
    // const disconnect = useDisconnect();

    const connectWallet = async() => {
        const wallet = await connect(metamaskConfig);
    }

    // const walletInstance = useWallet();

    const publishCampaign = async (form) => {
        try {
            const data = await createCampaign({
                args: [
                    address,    // owner address
                    form.title, // title
                    form.description,   // description
                    form.target,
                    new Date(form.deadline).getTime(),  // deadline
                    form.image,    
                ]
            })

            console.log("contract call success", data)
        } catch (error) {
            console.log("contract call failure", error)
        }
    };
    const getCampaigns = async () => {
        const campaigns = await contract.call('getCampaigns');
    
        const parsedCampaings = campaigns.map((campaign, i) => ({
          owner: campaign.owner,
          title: campaign.title,
          description: campaign.description,
          target: ethers.utils.formatEther(campaign.target.toString()),
          deadline: campaign.deadline.toNumber(),
          amountCollected: ethers.utils.formatEther(campaign.amountCollected.toString()),
          image: campaign.image,
          pId: i
        }));
    
        return parsedCampaings;
      };

      const getUserCampaigns = async () => {
        const allCampaigns = await getCampaigns();
    
        const filteredCampaigns = allCampaigns.filter((campaign) => campaign.owner === address);
    
        return filteredCampaigns;
      };
    
      const donate = async (pId, amount) => {
        const data = await contract.call('donateToCampaign', [pId], { value: ethers.utils.parseEther(amount)});
    
        return data;
      };

      const getDonations = async (pId) => {
        const donations = await contract.call('getDonators', [pId]);
        const numberOfDonations = donations[0].length;
    
        const parsedDonations = [];
    
        for(let i = 0; i < numberOfDonations; i++) {
          parsedDonations.push({
            donator: donations[0][i],
            donation: ethers.utils.formatEther(donations[1][i].toString())
          })
        };
    
        return parsedDonations;
      };
    
    return (
        <StateContext.Provider
            value={{
                address,
                contract,
                connectWallet,
                // disconnect,
                createCampaign: publishCampaign,
                // walletInstance
                getCampaigns,
                getUserCampaigns,
                donate,
                getDonations
            }}
        >
            {children}
        </StateContext.Provider>
    )
}

export const useStateContext = () => useContext(StateContext);